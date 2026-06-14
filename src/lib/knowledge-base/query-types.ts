export type QueryIntent =
  | 'symbol_lookup'
  | 'narrative_analysis'
  | 'compare_sources'
  | 'follow_up';

export type QueryLanguage = 'zh' | 'en' | 'mixed';

export interface SearchHistoryTurn {
  role: 'user' | 'assistant';
  content: string;
  citedChunkIds?: string[];
  citedTitles?: string[];
}

export interface RewriteRequest {
  query: string;
  locale: string;
  history?: SearchHistoryTurn[];
}

export interface RewrittenQuery {
  originalQuery: string;
  normalizedQuery: string;
  language: QueryLanguage;
  dreamSymbols: string[];
  emotions: string[];
  sourceHints: string[];
  expandedQueries: string[];
  lexicalQueries: string[];
  vectorQuery: string;
  rewriteMethod: 'rules' | 'llm' | 'hybrid';
  confidence: number;
}

export interface IntentScore {
  intent: QueryIntent;
  score: number;
  reasons: string[];
}

export interface IntentDecision {
  primary: QueryIntent;
  secondary?: QueryIntent;
  scores: IntentScore[];
  needsHistory: boolean;
  needsLexicalBoost: boolean;
  needsSourceDiversity: boolean;
}

export interface RetrievalChannelPlan {
  enabled: boolean;
  topK: number;
  weight: number;
}

export interface RetrievalPlan {
  intent: QueryIntent;
  vector: RetrievalChannelPlan & {
    query: string;
    candidateTopK: number;
  };
  lexical: RetrievalChannelPlan & {
    queries: string[];
  };
  rerank: {
    enabled: boolean;
    topK: number;
    contextTopK: number;
    enforceSourceDiversity: boolean;
  };
  answer: {
    enabled: boolean;
    style: 'direct' | 'reflective' | 'comparative';
  };
}
