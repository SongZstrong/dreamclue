import {
  COMPARE_MARKERS_EN,
  COMPARE_MARKERS_ZH,
  DREAM_SYMBOLS_EN,
  DREAM_SYMBOLS_ZH,
  EMOTIONS_EN,
  EMOTIONS_ZH,
  FOLLOW_UP_MARKERS_EN,
  FOLLOW_UP_MARKERS_ZH,
  SOURCE_HINTS_EN,
  SOURCE_HINTS_ZH,
  type TaxonomyEntry,
} from './dream-taxonomy';
import type {
  QueryLanguage,
  RewriteRequest,
  RewrittenQuery,
} from './query-types';
import { rewriteQueryWithLlm } from './rewrite-client';

function normalizeQueryText(query: string): string {
  return query
    .replace(/\r\n?/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();
}

function detectQueryLanguage(query: string): QueryLanguage {
  const hasChinese = /[\u4e00-\u9fff]/.test(query);
  const hasEnglish = /[a-zA-Z]/.test(query);

  if (hasChinese && hasEnglish) {
    return 'mixed';
  }
  if (hasChinese) {
    return 'zh';
  }
  return 'en';
}

function collectMatches(text: string, entries: TaxonomyEntry[]): string[] {
  const lowered = text.toLowerCase();
  const matches = new Set<string>();

  for (const entry of entries) {
    if (
      entry.aliases.some((alias) =>
        /[a-zA-Z]/.test(alias)
          ? lowered.includes(alias.toLowerCase())
          : text.includes(alias)
      )
    ) {
      matches.add(entry.canonical);
    }
  }

  return Array.from(matches);
}

function collectMarkers(text: string, markers: string[]): string[] {
  const lowered = text.toLowerCase();
  return markers.filter((marker) =>
    /[a-zA-Z]/.test(marker)
      ? lowered.includes(marker.toLowerCase())
      : text.includes(marker)
  );
}

function dedupeStrings(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean))
  );
}

function buildNormalizedQuery({
  original,
  symbols,
  emotions,
  sourceHints,
  history,
  locale,
}: {
  original: string;
  symbols: string[];
  emotions: string[];
  sourceHints: string[];
  history: RewriteRequest['history'];
  locale: string;
}) {
  const historyHints =
    history?.flatMap((turn) => turn.citedTitles || []).slice(-2) || [];

  if (locale.startsWith('zh')) {
    const parts = [
      symbols.length > 0 ? `梦见${symbols.join('、')}` : '',
      emotions.length > 0 ? `伴随${emotions.join('、')}情绪` : '',
      sourceHints.length > 0 ? `并关注${sourceHints.join('、')}视角` : '',
      historyHints.length > 0 ? `延续前文提到的${historyHints.join('、')}` : '',
    ].filter(Boolean);

    return parts.length > 0 ? parts.join('，') : original;
  }

  const parts = [
    symbols.length > 0 ? `dream about ${symbols.join(', ')}` : '',
    emotions.length > 0 ? `with emotions of ${emotions.join(', ')}` : '',
    sourceHints.length > 0 ? `from ${sourceHints.join(', ')} perspectives` : '',
    historyHints.length > 0
      ? `following earlier references to ${historyHints.join(', ')}`
      : '',
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : original;
}

function buildExpandedQueries(
  normalizedQuery: string,
  symbols: string[],
  emotions: string[]
): string[] {
  const expanded = [normalizedQuery];

  for (const symbol of symbols) {
    expanded.push(symbol);
  }

  if (symbols.length > 0 && emotions.length > 0) {
    expanded.push(`${symbols.join(' ')} ${emotions.join(' ')}`);
  }

  return dedupeStrings(expanded).slice(0, 6);
}

function buildConfidence({
  symbols,
  emotions,
  sourceHints,
  followUpMarkers,
  compareMarkers,
}: {
  symbols: string[];
  emotions: string[];
  sourceHints: string[];
  followUpMarkers: string[];
  compareMarkers: string[];
}) {
  let confidence = 0.4;

  if (symbols.length > 0) confidence += 0.2;
  if (symbols.length > 1) confidence += 0.1;
  if (emotions.length > 0) confidence += 0.1;
  if (sourceHints.length > 0) confidence += 0.08;
  if (followUpMarkers.length > 0) confidence += 0.04;
  if (compareMarkers.length > 0) confidence += 0.04;

  return Math.min(confidence, 0.95);
}

function mergeRewriteResult(
  rulesResult: RewrittenQuery,
  llmResult: Awaited<ReturnType<typeof rewriteQueryWithLlm>>
): RewrittenQuery {
  if (!llmResult) {
    return rulesResult;
  }

  return {
    ...rulesResult,
    normalizedQuery:
      llmResult.normalizedQuery?.trim() || rulesResult.normalizedQuery,
    dreamSymbols: dedupeStrings([
      ...rulesResult.dreamSymbols,
      ...(llmResult.dreamSymbols || []),
    ]),
    emotions: dedupeStrings([
      ...rulesResult.emotions,
      ...(llmResult.emotions || []),
    ]),
    sourceHints: dedupeStrings([
      ...rulesResult.sourceHints,
      ...(llmResult.sourceHints || []),
    ]),
    expandedQueries: dedupeStrings([
      ...rulesResult.expandedQueries,
      ...(llmResult.expandedQueries || []),
    ]).slice(0, 8),
    lexicalQueries: dedupeStrings([
      ...rulesResult.lexicalQueries,
      ...(llmResult.lexicalQueries || []),
    ]).slice(0, 10),
    vectorQuery:
      llmResult.normalizedQuery?.trim() || rulesResult.normalizedQuery,
    rewriteMethod: rulesResult.rewriteMethod === 'rules' ? 'hybrid' : 'llm',
    confidence: Math.max(
      rulesResult.confidence,
      Math.min(llmResult.confidence || 0, 0.99)
    ),
  };
}

export async function rewriteQuery(
  input: RewriteRequest
): Promise<RewrittenQuery> {
  const originalQuery = normalizeQueryText(input.query);
  const language = detectQueryLanguage(originalQuery);

  const symbols = dedupeStrings([
    ...collectMatches(originalQuery, DREAM_SYMBOLS_ZH),
    ...collectMatches(originalQuery, DREAM_SYMBOLS_EN),
  ]);
  const emotions = dedupeStrings([
    ...collectMatches(originalQuery, EMOTIONS_ZH),
    ...collectMatches(originalQuery, EMOTIONS_EN),
  ]);
  const sourceHints = dedupeStrings([
    ...collectMatches(originalQuery, SOURCE_HINTS_ZH),
    ...collectMatches(originalQuery, SOURCE_HINTS_EN),
  ]);
  const followUpMarkers = dedupeStrings([
    ...collectMarkers(originalQuery, FOLLOW_UP_MARKERS_ZH),
    ...collectMarkers(originalQuery, FOLLOW_UP_MARKERS_EN),
  ]);
  const compareMarkers = dedupeStrings([
    ...collectMarkers(originalQuery, COMPARE_MARKERS_ZH),
    ...collectMarkers(originalQuery, COMPARE_MARKERS_EN),
  ]);

  const normalizedQuery = buildNormalizedQuery({
    original: originalQuery,
    symbols,
    emotions,
    sourceHints,
    history: input.history,
    locale: input.locale,
  });

  const expandedQueries = buildExpandedQueries(
    normalizedQuery,
    symbols,
    emotions
  );
  const lexicalQueries = dedupeStrings([
    ...symbols,
    ...emotions,
    ...sourceHints,
    ...expandedQueries.slice(0, 3),
  ]);

  const rulesResult: RewrittenQuery = {
    originalQuery,
    normalizedQuery,
    language,
    dreamSymbols: symbols,
    emotions,
    sourceHints,
    expandedQueries,
    lexicalQueries,
    vectorQuery: normalizedQuery,
    rewriteMethod: 'rules',
    confidence: buildConfidence({
      symbols,
      emotions,
      sourceHints,
      followUpMarkers,
      compareMarkers,
    }),
  };

  if (rulesResult.confidence >= 0.72) {
    return rulesResult;
  }

  try {
    const llmResult = await rewriteQueryWithLlm({
      query: rulesResult.originalQuery,
      locale: input.locale,
      history: input.history?.map((turn) => ({
        role: turn.role,
        content: turn.content,
      })),
    });

    return mergeRewriteResult(rulesResult, llmResult);
  } catch (error) {
    console.error('query rewrite llm fallback error:', error);
    return rulesResult;
  }
}
