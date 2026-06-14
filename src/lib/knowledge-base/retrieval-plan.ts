import type {
  IntentDecision,
  RetrievalPlan,
  RewrittenQuery,
} from './query-types';

function createBaseVectorQuery(rewritten: RewrittenQuery): string {
  return rewritten.vectorQuery || rewritten.normalizedQuery;
}

export function buildRetrievalPlan(
  rewritten: RewrittenQuery,
  intent: IntentDecision,
  requestedTopK: number
): RetrievalPlan {
  const safeTopK = Math.min(Math.max(requestedTopK, 1), 50);

  switch (intent.primary) {
    case 'symbol_lookup':
      return {
        intent: intent.primary,
        vector: {
          enabled: true,
          topK: Math.min(safeTopK * 4, 32),
          weight: 0.4,
          query: createBaseVectorQuery(rewritten),
          candidateTopK: Math.min(safeTopK * 4, 32),
        },
        lexical: {
          enabled: true,
          topK: Math.min(safeTopK * 2, 16),
          weight: 0.6,
          queries: rewritten.lexicalQueries,
        },
        rerank: {
          enabled: true,
          topK: safeTopK,
          contextTopK: 4,
          enforceSourceDiversity: false,
        },
        answer: {
          enabled: true,
          style: 'direct',
        },
      };
    case 'compare_sources':
      return {
        intent: intent.primary,
        vector: {
          enabled: true,
          topK: Math.min(safeTopK * 4, 36),
          weight: 0.5,
          query: createBaseVectorQuery(rewritten),
          candidateTopK: Math.min(safeTopK * 4, 36),
        },
        lexical: {
          enabled: true,
          topK: Math.min(safeTopK * 2, 18),
          weight: 0.5,
          queries: rewritten.lexicalQueries,
        },
        rerank: {
          enabled: true,
          topK: safeTopK,
          contextTopK: 6,
          enforceSourceDiversity: true,
        },
        answer: {
          enabled: true,
          style: 'comparative',
        },
      };
    case 'follow_up':
      return {
        intent: intent.primary,
        vector: {
          enabled: true,
          topK: Math.min(safeTopK * 3, 24),
          weight: 0.7,
          query: createBaseVectorQuery(rewritten),
          candidateTopK: Math.min(safeTopK * 3, 24),
        },
        lexical: {
          enabled: true,
          topK: Math.min(safeTopK, 8),
          weight: 0.3,
          queries: rewritten.lexicalQueries,
        },
        rerank: {
          enabled: true,
          topK: safeTopK,
          contextTopK: 4,
          enforceSourceDiversity: false,
        },
        answer: {
          enabled: true,
          style: 'reflective',
        },
      };
    default:
      return {
        intent: intent.primary,
        vector: {
          enabled: true,
          topK: Math.min(safeTopK * 5, 40),
          weight: 0.8,
          query: createBaseVectorQuery(rewritten),
          candidateTopK: Math.min(safeTopK * 5, 40),
        },
        lexical: {
          enabled: true,
          topK: Math.min(safeTopK, 10),
          weight: 0.2,
          queries: rewritten.lexicalQueries,
        },
        rerank: {
          enabled: true,
          topK: safeTopK,
          contextTopK: 5,
          enforceSourceDiversity: true,
        },
        answer: {
          enabled: true,
          style: 'reflective',
        },
      };
  }
}
