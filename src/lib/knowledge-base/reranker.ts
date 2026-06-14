import type { SearchResult } from './vector-store';

const BAILIAN_BASE_URL =
  process.env.BAILIAN_BASE_URL || 'https://dashscope.aliyuncs.com';
const RERANK_MODEL = process.env.RERANK_MODEL || 'qwen3-rerank';
const RERANK_CONTEXT_TOP_K = Number.parseInt(
  process.env.RERANK_TOP_K || '5',
  10
);

interface RerankResponse {
  output?: {
    results?: Array<{
      index?: number;
      relevance_score?: number;
      document?: {
        text?: string;
      };
    }>;
  };
  results?: Array<{
    index?: number;
    relevance_score?: number;
    document?: {
      text?: string;
    };
  }>;
  message?: string;
}

export type RerankedSearchResult = SearchResult & {
  relevanceScore?: number;
};

function getRerankApiKey(): string | null {
  return process.env.BAILIAN_API_KEY || null;
}

function getRerankEndpoint(): string {
  const normalizedBaseUrl = BAILIAN_BASE_URL.replace(
    /\/compatible-mode\/v1\/?$/,
    ''
  ).replace(/\/+$/, '');
  const suffix = '/api/v1/services/rerank/text-rerank/text-rerank';

  return normalizedBaseUrl.endsWith('/api/v1/services/rerank/text-rerank')
    ? `${normalizedBaseUrl}/text-rerank`
    : `${normalizedBaseUrl}${suffix}`;
}

function getRawResults(payload: RerankResponse) {
  return payload.output?.results || payload.results || [];
}

export function getConfiguredRerankContextTopK(): number {
  return RERANK_CONTEXT_TOP_K;
}

export async function rerankSearchResults(
  query: string,
  results: SearchResult[],
  topK: number
): Promise<RerankedSearchResult[]> {
  if (results.length <= 1 || RERANK_MODEL === 'noop') {
    return results.slice(0, topK);
  }

  const apiKey = getRerankApiKey();
  if (!apiKey) {
    return results.slice(0, topK);
  }

  const response = await fetch(getRerankEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: RERANK_MODEL,
      input: {
        query,
        documents: results.map((result) => result.text),
      },
      parameters: {
        top_n: topK,
        return_documents: true,
      },
    }),
  });

  const payload = (await response.json()) as RerankResponse;

  if (!response.ok) {
    throw new Error(
      payload.message ||
        `Bailian rerank request failed with status ${response.status}`
    );
  }

  const rerankedItems = getRawResults(payload);

  if (!Array.isArray(rerankedItems) || rerankedItems.length === 0) {
    return results.slice(0, topK);
  }

  const rerankedResults: RerankedSearchResult[] = [];

  for (const item of rerankedItems) {
    const index = item.index;

    if (typeof index !== 'number' || !results[index]) {
      continue;
    }

    rerankedResults.push({
      ...results[index],
      text: item.document?.text || results[index].text,
      relevanceScore: item.relevance_score,
    });
  }

  return rerankedResults;
}
