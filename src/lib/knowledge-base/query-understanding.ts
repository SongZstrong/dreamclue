import {
  COMPARE_MARKERS_EN,
  COMPARE_MARKERS_ZH,
  EMOTIONS_EN,
  EMOTIONS_ZH,
  FOLLOW_UP_MARKERS_EN,
  FOLLOW_UP_MARKERS_ZH,
  type TaxonomyEntry,
} from './dream-taxonomy';
import type { QueryIntent, QueryLanguage, RewrittenQuery } from './query-types';
import {
  getSymbolSearchTerms,
  normalizeSymbolTerms,
} from './symbol-normalizer';

export const QUERY_UNDERSTANDING_PROMPT = [
  '提取用户梦境中的核心意象，并归一化为最基础的通用名词。',
  '例如：巨蟒/毒蛇 -> 蛇；大黄狗/小狗 -> 狗；门牙/大牙 -> 牙齿。',
  '只输出 JSON，不要解释。',
].join('\n');

export interface QueryUnderstanding {
  rawSymbols: string[];
  normalizedSymbols: string[];
  symbolSearchTerms: string[];
  emotions: string[];
  scenes: string[];
  intent: QueryIntent;
  language: QueryLanguage;
}

function detectLanguage(query: string): QueryLanguage {
  const hasChinese = /[\u4e00-\u9fff]/.test(query);
  const hasEnglish = /[a-zA-Z]/.test(query);

  if (hasChinese && hasEnglish) {
    return 'mixed';
  }

  return hasChinese ? 'zh' : 'en';
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

function detectScenes(query: string): string[] {
  const scenePatterns = [
    {
      scene: '学校',
      patterns: ['学校', '教室', '考试', 'school', 'classroom'],
    },
    {
      scene: '家',
      patterns: ['家里', '房子', '房间', 'home', 'house', 'room'],
    },
    { scene: '工作', patterns: ['公司', '办公室', '上班', 'work', 'office'] },
    {
      scene: '水域',
      patterns: ['河', '海', '湖', '水', 'river', 'sea', 'water'],
    },
    {
      scene: '交通',
      patterns: ['车', '火车', '飞机', '船', 'car', 'train', 'plane'],
    },
  ];

  return scenePatterns
    .filter((entry) =>
      entry.patterns.some((pattern) =>
        /[a-zA-Z]/.test(pattern)
          ? query.toLowerCase().includes(pattern.toLowerCase())
          : query.includes(pattern)
      )
    )
    .map((entry) => entry.scene);
}

function detectUnderstandingIntent(
  query: string,
  normalizedSymbols: string[]
): QueryIntent {
  if (
    collectMarkers(query, COMPARE_MARKERS_ZH).length > 0 ||
    collectMarkers(query, COMPARE_MARKERS_EN).length > 0
  ) {
    return 'compare_sources';
  }

  if (
    collectMarkers(query, FOLLOW_UP_MARKERS_ZH).length > 0 ||
    collectMarkers(query, FOLLOW_UP_MARKERS_EN).length > 0
  ) {
    return 'follow_up';
  }

  return normalizedSymbols.length > 0 ? 'symbol_lookup' : 'narrative_analysis';
}

function dedupe(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean))
  );
}

export function understandQuery({
  query,
  rewritten,
}: {
  query: string;
  rewritten?: RewrittenQuery;
}): QueryUnderstanding {
  const symbolResult = normalizeSymbolTerms([
    query,
    ...(rewritten?.dreamSymbols || []),
    ...(rewritten?.lexicalQueries || []),
  ]);
  const normalizedSymbols = dedupe([
    ...symbolResult.normalizedSymbols,
    ...(rewritten?.dreamSymbols || []),
  ]);
  const rawSymbols = dedupe(symbolResult.rawSymbols);
  const emotions = dedupe([
    ...(rewritten?.emotions || []),
    ...collectMatches(query, EMOTIONS_ZH),
    ...collectMatches(query, EMOTIONS_EN),
  ]);
  const language = rewritten?.language || detectLanguage(query);
  const scenes = detectScenes(query);
  const intent = detectUnderstandingIntent(query, normalizedSymbols);

  return {
    rawSymbols,
    normalizedSymbols,
    symbolSearchTerms: getSymbolSearchTerms({
      rawSymbols,
      normalizedSymbols,
      tags: symbolResult.tags,
      entries: symbolResult.entries,
    }),
    emotions,
    scenes,
    intent,
    language,
  };
}
