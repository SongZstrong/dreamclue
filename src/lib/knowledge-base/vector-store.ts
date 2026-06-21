import { getSqlClient, withDbConnectionRetry } from '@/db';
import type { DreamChunk } from './dream-chunker';
import { buildSearchTokens } from './lexical-tokens';
import type { SourceManifestEntry } from './source-manifest';

export type DocumentChunk = {
  id: string;
  file_id: string;
  file_name: string;
  title: string;
  text: string;
  search_tokens: string;
  chunk_id: number;
  start: number;
  end: number;
  embedding: string;
  language: string | null;
  source_type: string | null;
  section_title: string | null;
  section_path: string | null;
  symbol_terms: string[];
  tags: string[];
  chunk_type: string | null;
  token_count: number | null;
  quality_score: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type KnowledgeChunkInput = Pick<
  DreamChunk,
  | 'text'
  | 'chunkId'
  | 'start'
  | 'end'
  | 'chunkType'
  | 'sectionTitle'
  | 'sectionPath'
  | 'symbolTerms'
  | 'tags'
  | 'tokenCount'
  | 'qualityScore'
  | 'isActive'
  | 'metadata'
>;

export interface SearchResult {
  id: string;
  file_id: string;
  file_name: string;
  title: string;
  text: string;
  chunk_id: number;
  similarity: number;
  created_at: string;
  relevanceScore?: number;
  lexicalScore?: number;
  symbolScore?: number;
  rrfScore?: number;
  finalScore?: number;
  sourceChannel?: 'vector' | 'lexical' | 'symbol' | 'theory';
  sourceChannels?: Array<'vector' | 'lexical' | 'symbol' | 'theory'>;
  language?: string | null;
  source_type?: string | null;
  section_title?: string | null;
  section_path?: string | null;
  symbol_terms?: string[];
  tags?: string[];
  chunk_type?: string | null;
  token_count?: number | null;
  quality_score?: number;
  is_active?: boolean;
  source_weight?: number;
  metadata?: Record<string, unknown>;
}

type LegacyChunkInput = {
  text: string;
  chunkId: number;
  start: number;
  end: number;
};

type SearchRow = {
  id: string;
  file_id: string;
  file_name: string;
  title: string;
  text: string;
  chunk_id: number;
  created_at: string;
  distance?: number;
  lexical_score?: number;
  symbol_score?: number;
  language: string | null;
  source_type: string | null;
  section_title: string | null;
  section_path: string | null;
  symbol_terms: string[] | null;
  tags: string[] | null;
  chunk_type: string | null;
  token_count: number | null;
  quality_score: number | null;
  is_active: boolean | null;
  source_weight: number | null;
  metadata: Record<string, unknown> | null;
};

type SqlClient = ReturnType<typeof getSqlClient>;
type TransactionSqlClient = SqlClient & {
  savepoint?: <T>(
    cb: (sql: TransactionSqlClient) => T | Promise<T>
  ) => Promise<T>;
};

const INSERT_BATCH_SIZE = Math.max(
  1,
  Number.parseInt(process.env.KNOWLEDGE_VECTOR_INSERT_BATCH_SIZE || '25', 10) ||
    25
);

function toVectorLiteral(vector: number[]): string {
  return `[${vector.join(',')}]`;
}

function cleanJsonValue(value: unknown): unknown {
  if (value === undefined) {
    return null;
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => cleanJsonValue(item));
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .map(([key, entryValue]) => [key, cleanJsonValue(entryValue)])
  );
}

function cleanStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean);
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function nullableFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function assertNoUndefinedRows(rows: DocumentChunk[]) {
  for (const [rowIndex, row] of rows.entries()) {
    for (const [key, value] of Object.entries(row)) {
      if (value === undefined) {
        throw new Error(
          `Knowledge chunk row ${rowIndex} has undefined field: ${key}`
        );
      }
    }
  }
}

function isDreamChunk(
  chunk: LegacyChunkInput | KnowledgeChunkInput
): chunk is KnowledgeChunkInput {
  return 'chunkType' in chunk;
}

function buildRows(
  chunks: Array<LegacyChunkInput | KnowledgeChunkInput>,
  embeddings: number[][],
  fileId: string,
  fileName: string,
  title?: string,
  sourceConfig?: SourceManifestEntry
): DocumentChunk[] {
  if (chunks.length !== embeddings.length) {
    throw new Error('Number of chunks and embeddings must match');
  }
  if (embeddings.length === 0 || embeddings[0].length === 0) {
    throw new Error('Embeddings cannot be empty');
  }

  const now = new Date().toISOString();
  const resolvedTitle = title || fileName;

  return chunks.map((chunk, index) => {
    const dreamChunk = isDreamChunk(chunk) ? chunk : null;
    const text = typeof chunk.text === 'string' ? chunk.text : '';
    const symbolTerms = cleanStringArray(dreamChunk?.symbolTerms);
    const tags = cleanStringArray(dreamChunk?.tags);
    const sectionTitle = dreamChunk?.sectionTitle || null;
    const sectionPath = dreamChunk?.sectionPath || null;
    const metadata = cleanJsonValue(dreamChunk?.metadata || {});

    return {
      id: `${fileId}_${finiteNumber(chunk.chunkId, index)}`,
      file_id: fileId,
      file_name: fileName,
      title: resolvedTitle,
      text,
      search_tokens: buildSearchTokens(
        [
          resolvedTitle,
          sectionTitle || '',
          sectionPath || '',
          symbolTerms.join(' '),
          tags.join(' '),
          text,
        ].join(' ')
      ).join(' '),
      chunk_id: finiteNumber(chunk.chunkId, index),
      start: finiteNumber(chunk.start, 0),
      end: finiteNumber(chunk.end, 0),
      embedding: toVectorLiteral(embeddings[index]),
      language: dreamChunk ? sourceConfig?.language || null : null,
      source_type: dreamChunk ? sourceConfig?.sourceType || null : null,
      section_title: sectionTitle,
      section_path: sectionPath,
      symbol_terms: symbolTerms,
      tags,
      chunk_type: dreamChunk?.chunkType || null,
      token_count: nullableFiniteNumber(dreamChunk?.tokenCount),
      quality_score: finiteNumber(dreamChunk?.qualityScore, 1),
      is_active:
        typeof dreamChunk?.isActive === 'boolean' ? dreamChunk.isActive : true,
      metadata: metadata as Record<string, unknown>,
      created_at: now,
    };
  });
}

async function insertBatch(sql: SqlClient, batch: DocumentChunk[]) {
  for (const row of batch) {
    const metadataJson = JSON.stringify(row.metadata ?? {}) || '{}';

    await sql`
      insert into knowledge_chunks (
        id,
        file_id,
        file_name,
        title,
        text,
        search_tokens,
        chunk_id,
        start,
        "end",
        embedding,
        language,
        source_type,
        section_title,
        section_path,
        symbol_terms,
        tags,
        chunk_type,
        token_count,
        quality_score,
        is_active,
        metadata,
        created_at
      ) values (
        ${row.id},
        ${row.file_id},
        ${row.file_name},
        ${row.title},
        ${row.text},
        ${row.search_tokens},
        ${row.chunk_id},
        ${row.start},
        ${row.end},
        ${row.embedding}::vector,
        ${row.language},
        ${row.source_type},
        ${row.section_title},
        ${row.section_path},
        ${row.symbol_terms}::text[],
        ${row.tags}::text[],
        ${row.chunk_type},
        ${row.token_count},
        ${row.quality_score},
        ${row.is_active},
        ${metadataJson}::jsonb,
        ${row.created_at}
      )
      on conflict ("file_id", "chunk_id") do update set
        "file_name" = excluded."file_name",
        "title" = excluded."title",
        "text" = excluded."text",
        "search_tokens" = excluded."search_tokens",
        "start" = excluded."start",
        "end" = excluded."end",
        "embedding" = excluded."embedding",
        "language" = excluded."language",
        "source_type" = excluded."source_type",
        "section_title" = excluded."section_title",
        "section_path" = excluded."section_path",
        "symbol_terms" = excluded."symbol_terms",
        "tags" = excluded."tags",
        "chunk_type" = excluded."chunk_type",
        "token_count" = excluded."token_count",
        "quality_score" = excluded."quality_score",
        "is_active" = excluded."is_active",
        "metadata" = excluded."metadata",
        "created_at" = excluded."created_at"
    `;
  }
}

async function withOptionalSavepoint<T>(
  sql: SqlClient,
  operation: (scopedSql: SqlClient) => Promise<T>
): Promise<T> {
  const transactionSql = sql as TransactionSqlClient;

  if (transactionSql.savepoint) {
    return transactionSql.savepoint((savepointSql) =>
      operation(savepointSql as SqlClient)
    );
  }

  return operation(sql);
}

async function insertRows(
  sql: SqlClient,
  rows: DocumentChunk[],
  onProgress?: (inserted: number, total: number) => void
) {
  for (let index = 0; index < rows.length; index += INSERT_BATCH_SIZE) {
    const batch = rows.slice(index, index + INSERT_BATCH_SIZE);

    try {
      await withOptionalSavepoint(sql, (scopedSql) =>
        insertBatch(scopedSql, batch)
      );
    } catch (error) {
      console.warn(
        `Knowledge chunk batch insert failed at ${index + 1}-${index + batch.length}; retrying row by row.`,
        error
      );

      for (const row of batch) {
        await withOptionalSavepoint(sql, (scopedSql) =>
          insertBatch(scopedSql, [row])
        );
      }
    }

    onProgress?.(Math.min(index + batch.length, rows.length), rows.length);
  }
}

export async function addDocuments(
  chunks: Array<LegacyChunkInput | KnowledgeChunkInput>,
  embeddings: number[][],
  fileId: string,
  fileName: string,
  title?: string,
  sourceConfig?: SourceManifestEntry
): Promise<number> {
  const sql = getSqlClient();
  const rows = buildRows(
    chunks,
    embeddings,
    fileId,
    fileName,
    title,
    sourceConfig
  );
  assertNoUndefinedRows(rows);

  await insertRows(sql, rows);

  return rows.length;
}

export async function replaceDocumentsForFileWithMetadata(
  chunks: Array<LegacyChunkInput | KnowledgeChunkInput>,
  embeddings: number[][],
  fileId: string,
  fileName: string,
  title?: string,
  sourceConfig?: SourceManifestEntry
): Promise<number> {
  const rows = buildRows(
    chunks,
    embeddings,
    fileId,
    fileName,
    title,
    sourceConfig
  );
  assertNoUndefinedRows(rows);

  console.log(
    `Writing ${rows.length} knowledge chunks for file ${fileId} to Postgres`
  );

  await withDbConnectionRetry(async () => {
    const sql = getSqlClient();

    await sql.begin(async (transaction) => {
      const transactionalSql = transaction as unknown as ReturnType<
        typeof getSqlClient
      >;

      const fileRows = await transactionalSql<{ id: string }[]>`
        select id
        from knowledge_files
        where id = ${fileId}
        for update
      `;

      if (fileRows.length === 0) {
        throw new Error(
          `Knowledge file record not found for vector store insert: ${fileId}`
        );
      }

      await transactionalSql`
        delete from knowledge_chunks
        where file_id = ${fileId}
      `;

      await insertRows(transactionalSql, rows, (inserted, total) => {
        console.log(
          `Stored knowledge chunks batch ${inserted}/${total} for file ${fileId}`
        );
      });
    });
  });

  console.log(`Stored ${rows.length} knowledge chunks for file ${fileId}`);

  return rows.length;
}

export async function replaceDocumentsForFile(
  chunks: Array<LegacyChunkInput>,
  embeddings: number[][],
  fileId: string,
  fileName: string,
  title?: string
): Promise<number> {
  return replaceDocumentsForFileWithMetadata(
    chunks,
    embeddings,
    fileId,
    fileName,
    title
  );
}

function mapSearchRow(
  row: SearchRow,
  sourceChannel: SearchResult['sourceChannel']
): SearchResult {
  return {
    id: row.id,
    file_id: row.file_id,
    file_name: row.file_name,
    title: row.title,
    text: row.text,
    chunk_id: row.chunk_id,
    similarity: typeof row.distance === 'number' ? 1 - Number(row.distance) : 0,
    created_at: row.created_at,
    lexicalScore:
      typeof row.lexical_score === 'number'
        ? Number(row.lexical_score)
        : undefined,
    symbolScore:
      typeof row.symbol_score === 'number'
        ? Number(row.symbol_score)
        : undefined,
    sourceChannel,
    language: row.language,
    source_type: row.source_type,
    section_title: row.section_title,
    section_path: row.section_path,
    symbol_terms: row.symbol_terms || [],
    tags: row.tags || [],
    chunk_type: row.chunk_type,
    token_count: row.token_count,
    quality_score:
      typeof row.quality_score === 'number' ? Number(row.quality_score) : 1,
    is_active: row.is_active ?? true,
    source_weight:
      typeof row.source_weight === 'number' ? Number(row.source_weight) : 1,
    metadata: row.metadata || {},
  };
}

export async function searchDocuments(
  queryVector: number[],
  topK: number = 10,
  fileId?: string
): Promise<SearchResult[]> {
  const sql = getSqlClient();
  const vectorLiteral = toVectorLiteral(queryVector);

  const rows = fileId
    ? await sql<SearchRow[]>`
        select
          k.id,
          k.file_id,
          k.file_name,
          k.title,
          k.text,
          k.chunk_id,
          k.created_at,
          k.language,
          k.source_type,
          k.section_title,
          k.section_path,
          k.symbol_terms,
          k.tags,
          k.chunk_type,
          k.token_count,
          k.quality_score,
          k.is_active,
          k.metadata,
          coalesce(f.source_weight, 1) as source_weight,
          k.embedding <=> ${vectorLiteral}::vector as distance
        from knowledge_chunks k
        left join knowledge_files f on f.id = k.file_id
        where k.file_id = ${fileId}
          and coalesce(k.is_active, true) = true
          and coalesce(f.is_active, true) = true
        order by k.embedding <=> ${vectorLiteral}::vector
        limit ${topK}
      `
    : await sql<SearchRow[]>`
        select
          k.id,
          k.file_id,
          k.file_name,
          k.title,
          k.text,
          k.chunk_id,
          k.created_at,
          k.language,
          k.source_type,
          k.section_title,
          k.section_path,
          k.symbol_terms,
          k.tags,
          k.chunk_type,
          k.token_count,
          k.quality_score,
          k.is_active,
          k.metadata,
          coalesce(f.source_weight, 1) as source_weight,
          k.embedding <=> ${vectorLiteral}::vector as distance
        from knowledge_chunks k
        left join knowledge_files f on f.id = k.file_id
        where coalesce(k.is_active, true) = true
          and coalesce(f.is_active, true) = true
        order by k.embedding <=> ${vectorLiteral}::vector
        limit ${topK}
      `;

  return rows.map((row) => mapSearchRow(row, 'vector'));
}

export async function searchSymbolDocuments(
  symbolTerms: string[],
  topK: number = 10
): Promise<SearchResult[]> {
  const terms = Array.from(new Set(symbolTerms.filter(Boolean)));

  if (terms.length === 0 || topK <= 0) {
    return [];
  }

  const sql = getSqlClient();
  const rows = await sql<SearchRow[]>`
    select
      k.id,
      k.file_id,
      k.file_name,
      k.title,
      k.text,
      k.chunk_id,
      k.created_at,
      k.language,
      k.source_type,
      k.section_title,
      k.section_path,
      k.symbol_terms,
      k.tags,
      k.chunk_type,
      k.token_count,
      k.quality_score,
      k.is_active,
      k.metadata,
      coalesce(f.source_weight, 1) as source_weight,
      (
        select count(*)::real
        from unnest(coalesce(k.symbol_terms, array[]::text[])) as term
        where term = any(${terms}::text[])
      ) as symbol_score
    from knowledge_chunks k
    left join knowledge_files f on f.id = k.file_id
    where coalesce(k.is_active, true) = true
      and coalesce(f.is_active, true) = true
      and coalesce(k.symbol_terms, array[]::text[]) && ${terms}::text[]
    order by
      symbol_score desc,
      coalesce(k.quality_score, 1) desc,
      coalesce(f.source_weight, 1) desc
    limit ${topK}
  `;

  return rows.map((row) => mapSearchRow(row, 'symbol'));
}

function buildTsQuery(queries: string[]): string {
  const tokens = Array.from(
    new Set(
      queries.flatMap((query) => buildSearchTokens(query)).filter(Boolean)
    )
  ).slice(0, 12);

  return tokens.join(' | ');
}

export async function searchTheoryDocuments(
  queries: string[],
  topK: number = 8
): Promise<SearchResult[]> {
  const tsQuery = buildTsQuery(queries);

  if (!tsQuery || topK <= 0) {
    return [];
  }

  const sql = getSqlClient();
  const rows = await sql<SearchRow[]>`
    select
      k.id,
      k.file_id,
      k.file_name,
      k.title,
      k.text,
      k.chunk_id,
      k.created_at,
      k.language,
      k.source_type,
      k.section_title,
      k.section_path,
      k.symbol_terms,
      k.tags,
      k.chunk_type,
      k.token_count,
      k.quality_score,
      k.is_active,
      k.metadata,
      coalesce(f.source_weight, 1) as source_weight,
      ts_rank_cd(k.search_vector, to_tsquery('simple', ${tsQuery})) as lexical_score
    from knowledge_chunks k
    left join knowledge_files f on f.id = k.file_id
    where coalesce(k.is_active, true) = true
      and coalesce(f.is_active, true) = true
      and k.chunk_type = 'theory_section'
      and k.search_vector @@ to_tsquery('simple', ${tsQuery})
    order by lexical_score desc
    limit ${topK}
  `;

  return rows.map((row) => mapSearchRow(row, 'theory'));
}

export async function deleteByFileId(fileId: string): Promise<number> {
  const sql = getSqlClient();
  const result = await sql<{ deleted_count: number }[]>`
    with deleted as (
      delete from knowledge_chunks
      where file_id = ${fileId}
      returning 1
    )
    select count(*)::int as deleted_count from deleted
  `;

  return Number(result[0]?.deleted_count || 0);
}

export async function getStats(): Promise<{
  totalChunks: number;
  totalFiles: number;
}> {
  const sql = getSqlClient();
  const rows = await sql<{ total_chunks: number; total_files: number }[]>`
    select
      count(*)::int as total_chunks,
      count(distinct file_id)::int as total_files
    from knowledge_chunks
  `;

  return {
    totalChunks: Number(rows[0]?.total_chunks || 0),
    totalFiles: Number(rows[0]?.total_files || 0),
  };
}
