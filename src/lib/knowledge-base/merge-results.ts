import type { LexicalSearchResult } from './lexical-store';
import type { SearchResult } from './vector-store';

export function mergeAndDedupeResults(
  vectorResults: SearchResult[],
  lexicalResults: LexicalSearchResult[]
): SearchResult[] {
  const merged = new Map<string, SearchResult>();

  for (const result of vectorResults) {
    const key = `${result.file_id}:${result.chunk_id}`;
    merged.set(key, {
      ...result,
      sourceChannel: 'vector',
    } as SearchResult & { sourceChannel?: 'vector' | 'lexical' });
  }

  for (const result of lexicalResults) {
    const key = `${result.file_id}:${result.chunk_id}`;
    if (!merged.has(key)) {
      merged.set(key, result);
    }
  }

  return Array.from(merged.values());
}

export function diversifyResultsByFile(
  results: SearchResult[],
  maxPerFile: number
): SearchResult[] {
  if (maxPerFile <= 0) {
    return results;
  }

  const counts = new Map<string, number>();
  const diversified: SearchResult[] = [];

  for (const result of results) {
    const current = counts.get(result.file_id) || 0;
    if (current >= maxPerFile) {
      continue;
    }

    diversified.push(result);
    counts.set(result.file_id, current + 1);
  }

  return diversified;
}
