import { getSqlClient, withDbConnectionRetry } from '@/db';
import { buildSearchTokens } from './lexical-tokens';

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
  created_at: string;
};

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
  sourceChannel?: 'vector' | 'lexical';
}

function toVectorLiteral(vector: number[]): string {
  return `[${vector.join(',')}]`;
}

function buildRows(
  chunks: Array<{ text: string; chunkId: number; start: number; end: number }>,
  embeddings: number[][],
  fileId: string,
  fileName: string,
  title?: string
): DocumentChunk[] {
  if (chunks.length !== embeddings.length) {
    throw new Error('Number of chunks and embeddings must match');
  }
  if (embeddings.length === 0 || embeddings[0].length === 0) {
    throw new Error('Embeddings cannot be empty');
  }

  const now = new Date().toISOString();
  const resolvedTitle = title || fileName;
  return chunks.map((chunk, index) => ({
    id: `${fileId}_${chunk.chunkId}`,
    file_id: fileId,
    file_name: fileName,
    title: resolvedTitle,
    text: chunk.text,
    search_tokens: buildSearchTokens(`${resolvedTitle} ${chunk.text}`).join(
      ' '
    ),
    chunk_id: chunk.chunkId,
    start: chunk.start,
    end: chunk.end,
    embedding: toVectorLiteral(embeddings[index]),
    created_at: now,
  }));
}

async function insertRows(
  sql: ReturnType<typeof getSqlClient>,
  rows: DocumentChunk[]
) {
  for (const row of rows) {
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
        "created_at" = excluded."created_at"
    `;
  }
}

export async function addDocuments(
  chunks: Array<{ text: string; chunkId: number; start: number; end: number }>,
  embeddings: number[][],
  fileId: string,
  fileName: string,
  title?: string
): Promise<number> {
  const sql = getSqlClient();
  const rows = buildRows(chunks, embeddings, fileId, fileName, title);

  await insertRows(sql, rows);

  return rows.length;
}

export async function replaceDocumentsForFile(
  chunks: Array<{ text: string; chunkId: number; start: number; end: number }>,
  embeddings: number[][],
  fileId: string,
  fileName: string,
  title?: string
): Promise<number> {
  const rows = buildRows(chunks, embeddings, fileId, fileName, title);
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

      await insertRows(transactionalSql, rows);
    });
  });

  console.log(`Stored ${rows.length} knowledge chunks for file ${fileId}`);

  return rows.length;
}

export async function searchDocuments(
  queryVector: number[],
  topK: number = 10,
  fileId?: string
): Promise<SearchResult[]> {
  const sql = getSqlClient();
  const vectorLiteral = toVectorLiteral(queryVector);

  const rows = fileId
    ? await sql<
        {
          id: string;
          file_id: string;
          file_name: string;
          title: string;
          text: string;
          chunk_id: number;
          created_at: string;
          distance: number;
        }[]
      >`
        select
          id,
          file_id,
          file_name,
          title,
          text,
          chunk_id,
          created_at,
          embedding <=> ${vectorLiteral}::vector as distance
        from knowledge_chunks
        where file_id = ${fileId}
        order by embedding <=> ${vectorLiteral}::vector
        limit ${topK}
      `
    : await sql<
        {
          id: string;
          file_id: string;
          file_name: string;
          title: string;
          text: string;
          chunk_id: number;
          created_at: string;
          distance: number;
        }[]
      >`
        select
          id,
          file_id,
          file_name,
          title,
          text,
          chunk_id,
          created_at,
          embedding <=> ${vectorLiteral}::vector as distance
        from knowledge_chunks
        order by embedding <=> ${vectorLiteral}::vector
        limit ${topK}
      `;

  return rows.map((row) => ({
    id: row.id,
    file_id: row.file_id,
    file_name: row.file_name,
    title: row.title,
    text: row.text,
    chunk_id: row.chunk_id,
    similarity: 1 - Number(row.distance),
    created_at: row.created_at,
    sourceChannel: 'vector',
  }));
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
