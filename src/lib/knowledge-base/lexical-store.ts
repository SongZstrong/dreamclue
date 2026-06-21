import { getSqlClient } from '@/db';
import { buildSearchTokens } from './lexical-tokens';
import type { SearchResult } from './vector-store';

export interface LexicalSearchResult extends SearchResult {
  lexicalScore?: number;
  sourceChannel?: 'lexical';
}

function buildTsQuery(queries: string[]): string {
  const tokens = Array.from(
    new Set(
      queries.flatMap((query) => buildSearchTokens(query)).filter(Boolean)
    )
  ).slice(0, 12);

  if (tokens.length === 0) {
    return '';
  }

  return tokens.join(' | ');
}

export async function searchLexicalDocuments(
  queries: string[],
  topK: number
): Promise<LexicalSearchResult[]> {
  if (queries.length === 0 || topK <= 0) {
    return [];
  }

  const sql = getSqlClient();
  const tsQuery = buildTsQuery(queries);

  if (!tsQuery) {
    return [];
  }

  const rows = await sql<
    {
      id: string;
      file_id: string;
      file_name: string;
      title: string;
      text: string;
      chunk_id: number;
      created_at: string;
      lexical_score: number;
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
    }[]
  >`
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
    where k.search_vector @@ to_tsquery('simple', ${tsQuery})
      and coalesce(k.is_active, true) = true
      and coalesce(f.is_active, true) = true
    order by lexical_score desc
    limit ${topK}
  `;

  return rows.map((row) => ({
    id: row.id,
    file_id: row.file_id,
    file_name: row.file_name,
    title: row.title,
    text: row.text,
    chunk_id: row.chunk_id,
    similarity: 0,
    created_at: row.created_at,
    lexicalScore: Number(row.lexical_score),
    sourceChannel: 'lexical',
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
  }));
}
