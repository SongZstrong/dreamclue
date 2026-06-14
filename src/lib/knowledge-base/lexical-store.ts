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
      ts_rank_cd(search_vector, to_tsquery('simple', ${tsQuery})) as lexical_score
    from knowledge_chunks
    where search_vector @@ to_tsquery('simple', ${tsQuery})
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
  }));
}
