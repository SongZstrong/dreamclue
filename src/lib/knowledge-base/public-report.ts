import type { RerankedSearchResult } from './reranker';
import type { SearchResult } from './vector-store';

export type AnalysisSectionKey =
  | 'direct'
  | 'traditional'
  | 'modern'
  | 'emotion'
  | 'differences'
  | 'references';

export interface PublicKnowledgeResult {
  id: string;
  sourceTitle: string;
  entryTitle: string;
  sourceTypeLabel: string;
  relevance: number;
  matchedTerms: string[];
  summary: string;
  quote: string;
}

export interface PublicCitation {
  id: string;
  index: number;
  sourceTitle: string;
  entryTitle: string;
  sourceTypeLabel: string;
  quote: string;
  matchedTerms: string[];
}

export interface KnowledgeAnalysisSection {
  key: AnalysisSectionKey;
  title: string;
  content: string;
  citationIds: string[];
}

export interface KnowledgeAnalysisReport {
  title: string;
  modelLabel: string;
  sections: KnowledgeAnalysisSection[];
  citations: PublicCitation[];
  relatedResults: PublicKnowledgeResult[];
  disclaimer: string;
}

const SOURCE_TITLE_OVERRIDES: Array<[string, string]> = [
  ['ten thousand dreams interpreted', 'Ten Thousand Dreams Interpreted'],
  ['ten thousand dreams', 'Ten Thousand Dreams Interpreted'],
  ['miller ten thousand dreams', 'Ten Thousand Dreams Interpreted'],
  ['fontaine golden wheel', 'The Golden Wheel Dream-book and Fortune-teller'],
  ['golden wheel dream book', 'The Golden Wheel Dream-book and Fortune-teller'],
  ['golden wheel dream-book', 'The Golden Wheel Dream-book and Fortune-teller'],
  ['anonymous fortune telling', 'Fortune-Telling by Cards and Dreams'],
  [
    'fortune telling by cards and dreams',
    'Fortune-Telling by Cards and Dreams',
  ],
  ['freud dream psychology', 'Dream Psychology'],
  ['dream psychology', 'Dream Psychology'],
  ['freud interpretation of dreams', 'The Interpretation of Dreams'],
  ['interpretation of dreams', 'The Interpretation of Dreams'],
  ['carl gustav jung man and his symbols', 'Man and His Symbols'],
  ['man and his symbols', 'Man and His Symbols'],
  ['psychology of the unconscious', 'Psychology of the Unconscious'],
  ['zhougong', '周公解梦'],
  ['周公解梦', '周公解梦'],
  ['menglin xuanjie', '梦林玄解'],
  ['梦林玄解', '梦林玄解'],
];

const FIELD_ALIASES: Record<string, string> = {
  aliases: 'aliases',
  category: 'category',
  content: 'content',
  entry: 'entry',
  meaning: 'meaning',
  note: 'note',
  original: 'original',
  simplified: 'simplified',
  source: 'source',
  symbols: 'symbols',
  title: 'title',
  别名: 'aliases',
  原文: 'original',
  来源: 'source',
  意象: 'symbols',
  白话: 'simplified',
  类别: 'category',
  说明: 'note',
  释义: 'meaning',
};

const PUBLIC_MAX_QUOTE_LENGTH = 700;
const PUBLIC_MAX_SUMMARY_LENGTH = 220;

function isZh(locale: string): boolean {
  return locale.startsWith('zh');
}

function normalizeSourceKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/_modify\b/gi, '')
    .replace(/_combined\b/gi, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeDisplayTitle(value: string): string {
  return value
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/_modify\b/gi, '')
    .replace(/_combined\b/gi, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalFieldName(label: string): string | null {
  const normalized = label.trim().toLowerCase();
  return FIELD_ALIASES[normalized] || FIELD_ALIASES[label.trim()] || null;
}

function cleanTextWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanSingleLine(text: string): string {
  return cleanTextWhitespace(text)
    .replace(/\s*\n\s*/g, ' ')
    .trim();
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

function getResultScore(result: SearchResult): number {
  if (typeof result.relevanceScore === 'number') {
    return clampScore(result.relevanceScore);
  }

  if (typeof result.finalScore === 'number') {
    return clampScore(result.finalScore);
  }

  if (typeof result.rrfScore === 'number') {
    return clampScore(result.rrfScore);
  }

  if (typeof result.symbolScore === 'number' && result.symbolScore > 0) {
    return clampScore(result.symbolScore / 3);
  }

  if (typeof result.lexicalScore === 'number' && result.lexicalScore > 0) {
    return clampScore(result.lexicalScore);
  }

  return clampScore(result.similarity);
}

function parseStructuredFields(text: string): Record<string, string> {
  const fields: Record<string, string[]> = {};
  let activeField: string | null = null;
  const lines = text.replace(/\r\n/g, '\n').split('\n');

  for (const line of lines) {
    const match = line.match(
      /^\s*([A-Za-z][A-Za-z /_-]{1,40}|[\u4e00-\u9fff]{1,8})\s*[:：]\s*(.*)$/
    );
    const fieldName = match ? canonicalFieldName(match[1]) : null;

    if (fieldName) {
      activeField = fieldName;
      fields[fieldName] ||= [];
      if (match?.[2]) {
        fields[fieldName].push(match[2].trim());
      }
      continue;
    }

    if (activeField && line.trim()) {
      fields[activeField].push(line.trim());
    }
  }

  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      cleanTextWhitespace(value.join('\n')),
    ])
  );
}

function getField(
  fields: Record<string, string>,
  text: string,
  names: string[]
): string {
  for (const name of names) {
    if (fields[name]) {
      return fields[name];
    }
  }

  const allLabels = [
    'Aliases',
    'Category',
    'Content',
    'Entry',
    'Meaning',
    'Note',
    'Original',
    'Simplified',
    'Source',
    'Symbols',
    'Title',
    '别名',
    '原文',
    '来源',
    '意象',
    '白话',
    '类别',
    '说明',
    '释义',
  ].join('|');

  for (const name of names) {
    const labels = Object.entries(FIELD_ALIASES)
      .filter(([, canonical]) => canonical === name)
      .map(([label]) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    const match = text.match(
      new RegExp(
        `(?:^|\\s)(?:${labels})[:：]\\s*([\\s\\S]*?)(?=\\s(?:${allLabels})[:：]|$)`,
        'i'
      )
    );

    if (match?.[1]) {
      return cleanTextWhitespace(match[1]);
    }
  }

  return '';
}

function stripMetadataLines(text: string): string {
  const metadataLine =
    /^\s*(?:Source|Entry|Symbols|Aliases|Category|Note|Traditional note|来源|类别|意象|别名|说明)\s*[:：]/i;

  return text
    .replace(
      /^Source:\s*[\s\S]*?(?=(?:Original|Simplified|Meaning|Content|原文|白话|释义)[:：])/i,
      ''
    )
    .replace(/^来源：\s*[\s\S]*?(?=(?:原文|白话|释义)[:：])/i, '')
    .split('\n')
    .filter((line) => !metadataLine.test(line))
    .join('\n')
    .replace(
      /^(?:Original|Simplified|Meaning|Content|原文|白话|释义)\s*[:：]\s*/i,
      ''
    )
    .replace(/Traditional note:.*$/i, '')
    .replace(/Note:.*$/i, '')
    .trim();
}

function splitSentences(text: string): string[] {
  const matches =
    cleanSingleLine(text).match(/[^.!?。！？；;]+[.!?。！？；;]?/g) || [];

  return matches.map((sentence) => sentence.trim()).filter(Boolean);
}

function containsTerm(text: string, term: string): boolean {
  const cleanTerm = term.trim();
  if (!cleanTerm) {
    return false;
  }

  if (/[\u4e00-\u9fff]/.test(cleanTerm)) {
    return text.includes(cleanTerm);
  }

  if (cleanTerm.length < 3) {
    return false;
  }

  return text.toLowerCase().includes(cleanTerm.toLowerCase());
}

function trimToCompleteSentence(text: string, maxLength: number): string {
  const cleanText = cleanTextWhitespace(text);

  if (cleanText.length <= maxLength) {
    return cleanText;
  }

  const clipped = cleanText.slice(0, maxLength);
  const punctuationIndex = Math.max(
    clipped.lastIndexOf('。'),
    clipped.lastIndexOf('！'),
    clipped.lastIndexOf('？'),
    clipped.lastIndexOf('.'),
    clipped.lastIndexOf('!'),
    clipped.lastIndexOf('?'),
    clipped.lastIndexOf(';'),
    clipped.lastIndexOf('；')
  );

  if (punctuationIndex > Math.floor(maxLength * 0.45)) {
    return `${clipped.slice(0, punctuationIndex + 1).trim()}...`;
  }

  const spaceIndex = clipped.lastIndexOf(' ');
  if (spaceIndex > Math.floor(maxLength * 0.45)) {
    return `${clipped.slice(0, spaceIndex).trim()}...`;
  }

  return `${clipped.trim()}...`;
}

function sentenceWindow(
  text: string,
  terms: string[],
  maxLength: number
): string {
  const cleanText = cleanTextWhitespace(text);

  if (cleanText.length <= maxLength) {
    return cleanText;
  }

  const sentences = splitSentences(cleanText);
  const hitIndex = sentences.findIndex((sentence) =>
    terms.some((term) => containsTerm(sentence, term))
  );

  if (hitIndex >= 0) {
    const selected = sentences
      .slice(
        Math.max(0, hitIndex - 1),
        Math.min(sentences.length, hitIndex + 2)
      )
      .join(' ');

    return trimToCompleteSentence(selected, maxLength);
  }

  return trimToCompleteSentence(cleanText, maxLength);
}

export function getKnowledgeDisclaimer(locale: string): string {
  if (isZh(locale)) {
    return 'Dreamclueai 的分析由大模型结合知识库检索生成，可能存在遗漏、误读或不准确内容。结果仅供文化阅读、自我反思和娱乐参考，不构成医学、心理治疗、法律或事实判断建议。';
  }

  return 'Dreamclueai analysis is generated by a large language model with retrieved knowledge-base sources and may contain omissions, misreadings, or inaccuracies. It is for cultural reading, self-reflection, and entertainment only, and is not medical, therapeutic, legal, or factual advice.';
}

export function getAnswerModelLabel(locale: string): string {
  return isZh(locale) ? '由大模型生成' : 'Generated by a large language model';
}

export function sanitizeSourceTitle({
  title,
  fileName,
}: {
  title?: string | null;
  fileName?: string | null;
}): string {
  const candidates = [title, fileName].filter(
    (value): value is string => typeof value === 'string' && value.trim() !== ''
  );

  for (const candidate of candidates) {
    const key = normalizeSourceKey(candidate);
    const override = SOURCE_TITLE_OVERRIDES.find(([needle]) =>
      key.includes(needle)
    );

    if (override) {
      return override[1];
    }
  }

  const fallback = candidates[0] || 'Dream source';
  return normalizeDisplayTitle(fallback);
}

export function getSourceTypeLabel(
  sourceType: string | null | undefined,
  locale: string
): string {
  const labels = isZh(locale)
    ? {
        chinese_traditional: '中国传统梦书',
        western_traditional: '西方传统梦书',
        psychoanalytic: '心理分析理论',
        modern_sleep_science: '现代睡眠科学',
        curated_symbol: '整理意象资料',
      }
    : {
        chinese_traditional: 'Chinese traditional dream book',
        western_traditional: 'Western traditional dream book',
        psychoanalytic: 'Psychoanalytic theory',
        modern_sleep_science: 'Modern sleep science',
        curated_symbol: 'Curated symbol source',
      };

  return (
    labels[sourceType as keyof typeof labels] ||
    (isZh(locale) ? '梦境资料' : 'Dream source')
  );
}

export function getEntryTitle(
  result: Pick<
    SearchResult,
    'section_title' | 'text' | 'title' | 'file_name' | 'chunk_id'
  >,
  locale: string
): string {
  const fields = parseStructuredFields(result.text);
  const parsedEntry = getField(fields, result.text, ['entry', 'title']);
  const rawTitle =
    result.section_title ||
    parsedEntry ||
    result.text
      .split('\n')
      .map((line) => line.trim())
      .find(
        (line) =>
          line &&
          !/^(?:Source|Entry|Symbols|Aliases|Category|Meaning|Content|Note|来源|类别|意象|原文|白话|释义|说明)\s*[:：]/i.test(
            line
          )
      ) ||
    sanitizeSourceTitle({ title: result.title, fileName: result.file_name });
  const cleaned = normalizeDisplayTitle(rawTitle)
    .replace(/\s*>\s*/g, ' · ')
    .replace(
      /^THEORY SECTION\s*/i,
      isZh(locale) ? '理论片段 ' : 'Theory section '
    )
    .trim();

  if (!cleaned) {
    return isZh(locale)
      ? `资料片段 ${result.chunk_id + 1}`
      : `Source passage ${result.chunk_id + 1}`;
  }

  return cleaned.slice(0, 90);
}

export function buildDisplayQuote(
  text: string,
  terms: string[] = [],
  sourceType?: string | null
): string {
  const fields = parseStructuredFields(text);
  const original = getField(fields, text, ['original']);
  const simplified = getField(fields, text, ['simplified']);
  const meaning = getField(fields, text, ['meaning']);
  const content = getField(fields, text, ['content']);

  let candidate = '';
  if (sourceType === 'chinese_traditional' && (original || simplified)) {
    if (
      original &&
      simplified &&
      original !== simplified &&
      original.length + simplified.length <= PUBLIC_MAX_QUOTE_LENGTH
    ) {
      candidate = `${original}\n${simplified}`;
    } else {
      candidate = original || simplified;
    }
  } else {
    candidate = meaning || content || original || simplified;
  }

  if (!candidate) {
    candidate = stripMetadataLines(text);
  }

  return sentenceWindow(candidate, terms, PUBLIC_MAX_QUOTE_LENGTH);
}

function buildSummary(quote: string): string {
  return trimToCompleteSentence(quote, PUBLIC_MAX_SUMMARY_LENGTH);
}

function normalizeTerm(term: string): string {
  return term.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function getMatchedTerms({
  text,
  queryTerms,
  fallbackTerms,
}: {
  text: string;
  queryTerms?: string[];
  fallbackTerms?: string[];
}): string[] {
  const cleanText = text.toLowerCase();
  const terms = [...(queryTerms || []), ...(fallbackTerms || [])];
  const matched: string[] = [];
  const seen = new Set<string>();

  for (const term of terms) {
    const normalized = normalizeTerm(term);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    if (containsTerm(cleanText, normalized)) {
      seen.add(normalized);
      matched.push(term.trim());
    }

    if (matched.length >= 6) {
      break;
    }
  }

  return matched;
}

export function buildPublicKnowledgeResult(
  result: SearchResult,
  locale: string,
  queryTerms: string[] = []
): PublicKnowledgeResult {
  const sourceTitle = sanitizeSourceTitle({
    title: result.title,
    fileName: result.file_name,
  });
  const entryTitle = getEntryTitle(result, locale);
  const fallbackTerms = [
    ...(result.symbol_terms || []),
    ...(result.tags || []),
    entryTitle,
  ];
  const quote = buildDisplayQuote(
    result.text,
    [...queryTerms, ...fallbackTerms],
    result.source_type
  );
  const matchedTerms = getMatchedTerms({
    text: `${entryTitle}\n${quote}\n${result.text}`,
    queryTerms,
    fallbackTerms,
  });

  return {
    id: result.id,
    sourceTitle,
    entryTitle,
    sourceTypeLabel: getSourceTypeLabel(result.source_type, locale),
    relevance: getResultScore(result),
    matchedTerms,
    summary: buildSummary(quote),
    quote,
  };
}

export function buildPublicKnowledgeResults(
  results: SearchResult[],
  locale: string,
  queryTerms: string[] = []
): PublicKnowledgeResult[] {
  return results.map((result) =>
    buildPublicKnowledgeResult(result, locale, queryTerms)
  );
}

export function buildPublicCitation(
  result: RerankedSearchResult,
  index: number,
  locale: string,
  queryTerms: string[] = []
): PublicCitation {
  const publicResult = buildPublicKnowledgeResult(result, locale, queryTerms);

  return {
    id: result.id,
    index,
    sourceTitle: publicResult.sourceTitle,
    entryTitle: publicResult.entryTitle,
    sourceTypeLabel: publicResult.sourceTypeLabel,
    quote: publicResult.quote,
    matchedTerms: publicResult.matchedTerms,
  };
}

export function buildPublicCitations(
  results: RerankedSearchResult[],
  locale: string,
  queryTerms: string[] = []
): PublicCitation[] {
  return results.map((result, index) =>
    buildPublicCitation(result, index + 1, locale, queryTerms)
  );
}

function scoreResultForTerm(
  result: RerankedSearchResult,
  term: string
): number {
  const haystack = [
    result.section_title || '',
    result.text,
    ...(result.symbol_terms || []),
    ...(result.tags || []),
  ].join('\n');

  if (!containsTerm(haystack, term)) {
    return -1;
  }

  return getResultScore(result);
}

function canAddResult(
  selected: RerankedSearchResult[],
  result: RerankedSearchResult
): boolean {
  if (selected.some((item) => item.id === result.id)) {
    return false;
  }

  const sameFileCount = selected.filter(
    (item) => item.file_id === result.file_id
  ).length;

  return sameFileCount < 2;
}

export function selectAnswerContextResults({
  results,
  queryTerms,
  limit,
}: {
  results: RerankedSearchResult[];
  queryTerms: string[];
  limit: number;
}): RerankedSearchResult[] {
  const selected: RerankedSearchResult[] = [];
  const cleanTerms = Array.from(new Set(queryTerms.map(normalizeTerm))).filter(
    Boolean
  );

  for (const term of cleanTerms) {
    const best = results
      .filter((result) => canAddResult(selected, result))
      .map((result) => ({
        result,
        score: scoreResultForTerm(result, term),
      }))
      .filter((item) => item.score >= 0)
      .sort((a, b) => b.score - a.score)[0]?.result;

    if (best) {
      selected.push(best);
    }

    if (selected.length >= limit) {
      return selected;
    }
  }

  const sourceGroups = [
    ['chinese_traditional'],
    ['western_traditional'],
    ['psychoanalytic', 'modern_sleep_science', 'curated_symbol'],
  ];

  for (const sourceTypes of sourceGroups) {
    const best = results.find(
      (result) =>
        canAddResult(selected, result) &&
        sourceTypes.includes(result.source_type || '')
    );

    if (best) {
      selected.push(best);
    }

    if (selected.length >= limit) {
      return selected;
    }
  }

  for (const result of results) {
    if (canAddResult(selected, result)) {
      selected.push(result);
    }

    if (selected.length >= limit) {
      break;
    }
  }

  return selected;
}

function extractCitationIds(content: string): string[] {
  return Array.from(content.matchAll(/\[(\d+)\]/g)).map((match) => match[1]);
}

function sectionDefinitions(locale: string) {
  if (isZh(locale)) {
    return [
      { key: 'direct', title: '直接解释', aliases: ['直接解释'] },
      {
        key: 'traditional',
        title: '传统梦书视角',
        aliases: ['传统梦书视角', '传统视角'],
      },
      {
        key: 'modern',
        title: '心理学/现代视角',
        aliases: ['心理学/现代视角', '心理学视角', '现代视角'],
      },
      {
        key: 'emotion',
        title: '可能关联的现实情绪',
        aliases: ['可能关联的现实情绪', '现实情绪'],
      },
      {
        key: 'differences',
        title: '不同来源的差异',
        aliases: ['不同来源的差异', '来源差异'],
      },
      { key: 'references', title: '参考来源', aliases: ['参考来源'] },
    ] as const;
  }

  return [
    {
      key: 'direct',
      title: 'Direct Interpretation',
      aliases: ['Direct Interpretation'],
    },
    {
      key: 'traditional',
      title: 'Traditional Dream-Book View',
      aliases: ['Traditional Dream-Book View', 'Traditional View'],
    },
    {
      key: 'modern',
      title: 'Psychology / Modern View',
      aliases: ['Psychology / Modern View', 'Psychology View', 'Modern View'],
    },
    {
      key: 'emotion',
      title: 'Possible Real-Life Emotions',
      aliases: ['Possible Real-Life Emotions', 'Real-Life Emotions'],
    },
    {
      key: 'differences',
      title: 'Differences Across Sources',
      aliases: ['Differences Across Sources', 'Source Differences'],
    },
    { key: 'references', title: 'References', aliases: ['References'] },
  ] as const;
}

function normalizeHeading(line: string): string {
  return line
    .replace(/^#{1,6}\s*/, '')
    .replace(/^\*\*|\*\*$/g, '')
    .replace(/^[-*\d.、\s]+/, '')
    .replace(/[:：]\s*$/, '')
    .trim()
    .toLowerCase();
}

export function parseAnswerSections(
  content: string,
  locale: string
): KnowledgeAnalysisSection[] {
  const definitions = sectionDefinitions(locale);
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const sections: KnowledgeAnalysisSection[] = [];
  let active: {
    key: AnalysisSectionKey;
    title: string;
    lines: string[];
  } | null = null;

  for (const line of lines) {
    const normalized = normalizeHeading(line);
    const matched = definitions.find((definition) =>
      definition.aliases.some((alias) => alias.toLowerCase() === normalized)
    );

    if (matched) {
      if (active?.lines.join('\n').trim()) {
        const sectionContent = active.lines.join('\n').trim();
        sections.push({
          key: active.key,
          title: active.title,
          content: sectionContent,
          citationIds: extractCitationIds(sectionContent),
        });
      }

      active = {
        key: matched.key,
        title: matched.title,
        lines: [],
      };
      continue;
    }

    if (!active) {
      active = {
        key: 'direct',
        title: definitions[0].title,
        lines: [],
      };
    }

    active.lines.push(line);
  }

  if (active?.lines.join('\n').trim()) {
    const sectionContent = active.lines.join('\n').trim();
    sections.push({
      key: active.key,
      title: active.title,
      content: sectionContent,
      citationIds: extractCitationIds(sectionContent),
    });
  }

  if (sections.length === 0 && content.trim()) {
    return [
      {
        key: 'direct',
        title: definitions[0].title,
        content: content.trim(),
        citationIds: extractCitationIds(content),
      },
    ];
  }

  return sections;
}
