import { type CleanTextReport, scoreChunkQuality } from './cleaners';
import { expandSymbolTerms, normalizeSymbolTerms } from './symbol-normalizer';
import type { SourceManifestEntry } from './source-manifest';

export type DreamChunkType =
  | 'symbol_entry'
  | 'theory_section'
  | 'case_or_example'
  | 'source_intro';

export interface DreamChunk {
  text: string;
  chunkId: number;
  chunkType: DreamChunkType;
  sectionTitle: string | null;
  sectionPath: string | null;
  symbolTerms: string[];
  tags: string[];
  tokenCount: number;
  qualityScore: number;
  isActive: boolean;
  metadata: Record<string, unknown>;
  start: number;
  end: number;
}

const THEORY_WINDOW_WORDS = 200;
const THEORY_OVERLAP_WORDS = 35;
const THEORY_MAX_WORDS = 300;
const THEORY_MIN_WORDS = 80;
const MAX_ENTRY_WORDS = 200;
const MAX_ENTRY_CHARS = 1600;

function dedupe(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean))
  );
}

function estimateTokenCount(text: string): number {
  const englishTokens = text.match(/[a-zA-Z0-9]+(?:'[a-z]+)?/g) || [];
  const cjkChars = text.match(/[\u4e00-\u9fff]/g) || [];

  return englishTokens.length + Math.ceil(cjkChars.length / 2);
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function protectSentenceDots(text: string): string {
  return text
    .replace(/\b(e\.g|i\.e)\./gi, (match) => match.replace(/\./g, '__DOT__'))
    .replace(
      /\b(Mr|Mrs|Ms|Dr|Prof|St|Jr|Sr|vs|etc|Fig|No|Vol|Chap|Cf|cf)\./g,
      '$1__DOT__'
    )
    .replace(/\b(p|pp)\.(?=\s*\d)/gi, '$1__DOT__')
    .replace(/(?:\b[A-Z]\.\s*){2,}/g, (match) =>
      match.replace(/\./g, '__DOT__')
    );
}

function restoreSentenceDots(text: string): string {
  return text.replace(/__DOT__/g, '.');
}

function splitTheorySentences(text: string): string[] {
  const protectedText = protectSentenceDots(text);
  const sentences = protectedText
    .split(/(?<=[.!?])\s+(?=["'([A-Z0-9])/)
    .map((sentence) => restoreSentenceDots(sentence).trim())
    .filter(Boolean);

  return sentences.length > 0 ? sentences : [text];
}

function detectChunkType(text: string, sourceConfig: SourceManifestEntry) {
  if (sourceConfig.chunkProfile === 'theory_sliding_window') {
    return 'theory_section' satisfies DreamChunkType;
  }

  if (sourceConfig.chunkProfile === 'western_symbol_dictionary') {
    return 'symbol_entry' satisfies DreamChunkType;
  }

  if (/case|example|案例|例|梦例/i.test(text)) {
    return 'case_or_example' satisfies DreamChunkType;
  }

  const symbols = normalizeSymbolTerms(text);
  return symbols.normalizedSymbols.length > 0
    ? ('symbol_entry' satisfies DreamChunkType)
    : ('source_intro' satisfies DreamChunkType);
}

function buildSectionTitle(
  text: string,
  symbols: string[],
  fallback: string
): string {
  if (symbols.length > 0) {
    return symbols.join(' / ');
  }

  const firstLine = text
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean);

  return (firstLine || fallback).slice(0, 80);
}

function enrichTraditionalText({
  text,
  sourceConfig,
  sectionTitle,
  symbols,
}: {
  text: string;
  sourceConfig: SourceManifestEntry;
  sectionTitle: string;
  symbols: string[];
}) {
  if (sourceConfig.sourceType === 'chinese_traditional') {
    return [
      `来源：《${sourceConfig.title}》`,
      `类别：${sectionTitle}`,
      symbols.length > 0 ? `意象：${symbols.join('、')}` : '',
      `原文：${text}`,
      '传统释义：此条属于传统吉凶占梦，不应被表述为事实。',
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (sourceConfig.sourceType === 'western_traditional') {
    return [
      `Source: ${sourceConfig.title}`,
      `Entry: ${sectionTitle}`,
      symbols.length > 0 ? `Symbols: ${symbols.join(', ')}` : '',
      text,
      'Traditional note: this is historical dream-book material, not a factual claim.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  return text;
}

function createChunk({
  text,
  chunkId,
  sourceConfig,
  cleanReport,
  start,
  end,
  sectionPath,
  sectionTitle,
}: {
  text: string;
  chunkId: number;
  sourceConfig: SourceManifestEntry;
  cleanReport: CleanTextReport;
  start: number;
  end: number;
  sectionPath?: string | null;
  sectionTitle?: string | null;
}): DreamChunk {
  const normalized = normalizeSymbolTerms(text);
  const includeAliases = sourceConfig.sourceType === 'curated_symbol';
  const symbolTerms = expandSymbolTerms(
    [...normalized.rawSymbols, ...normalized.normalizedSymbols],
    { includeAliases }
  );
  const chunkType = detectChunkType(text, sourceConfig);
  const resolvedSectionTitle =
    sectionTitle ||
    buildSectionTitle(text, normalized.normalizedSymbols, sourceConfig.title);
  const enrichedText =
    chunkType === 'symbol_entry'
      ? enrichTraditionalText({
          text,
          sourceConfig,
          sectionTitle: resolvedSectionTitle,
          symbols: normalized.normalizedSymbols,
        })
      : text;
  const quality = scoreChunkQuality(enrichedText);

  return {
    text: enrichedText,
    chunkId,
    chunkType,
    sectionTitle: resolvedSectionTitle,
    sectionPath: sectionPath || resolvedSectionTitle,
    symbolTerms,
    tags: dedupe(normalized.tags),
    tokenCount: estimateTokenCount(enrichedText),
    qualityScore: quality.qualityScore,
    isActive: quality.isActive,
    metadata: {
      rawSymbols: normalized.rawSymbols,
      normalizedSymbols: normalized.normalizedSymbols,
      qualityWarnings: quality.warnings,
      cleanNoiseRatio: cleanReport.noiseRatio,
      cleanRemovedBlocks: cleanReport.removedBlocks,
    },
    start,
    end,
  };
}

function splitLongEntry(text: string): string[] {
  if (text.length <= MAX_ENTRY_CHARS && countWords(text) <= MAX_ENTRY_WORDS) {
    return [text];
  }

  const sentences = text
    .split(/(?<=[。！？.!?；;])\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  let currentWords = 0;

  for (const sentence of sentences) {
    const sentenceWords = countWords(sentence);

    if (
      current &&
      (`${current} ${sentence}`.length > MAX_ENTRY_CHARS ||
        currentWords + sentenceWords > MAX_ENTRY_WORDS)
    ) {
      chunks.push(current.trim());
      current = sentence;
      currentWords = sentenceWords;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
      currentWords += sentenceWords;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.length > 0 ? chunks : [text.slice(0, MAX_ENTRY_CHARS)];
}

function splitChineseEntries(text: string): string[] {
  return text
    .split(/\n{1,2}/)
    .flatMap((paragraph) => splitLongEntry(paragraph.trim()))
    .map((entry) => entry.trim())
    .filter((entry) => entry.length >= 8);
}

function isWesternEntryHeading(line: string): boolean {
  const trimmed = line.trim();

  if (trimmed.length < 2 || trimmed.length > 60) {
    return false;
  }

  if (/[.!?。！？]$/.test(trimmed)) {
    return false;
  }

  return /^[A-Z][A-Z0-9 '&,-]+$/.test(trimmed);
}

function normalizeWesternEntryTitle(title: string): string {
  return title
    .replace(/\s+/g, ' ')
    .replace(/\s+or\s+/gi, ' OR ')
    .replace(/[.:-]+$/g, '')
    .trim()
    .toUpperCase();
}

function cleanWesternEntryBody(text: string): string {
  return text
    .replace(/([A-Za-z])-\n([a-z])/g, '$1$2')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\.\s+\d{1,2}(?:,\s*\d{1,2}){0,4}\.(?=\s|$)/g, '.')
    .replace(/\s+\d{1,2}(?:,\s*\d{1,2}){0,4}\.$/g, '')
    .replace(/\.{2,}/g, '.')
    .trim();
}

function splitWesternDashEntries(text: string): string[] {
  const entryRegex = /(?:^|\n)([A-Z][A-Za-z][A-Za-z ',-]{0,58})\.--/g;
  const matches = Array.from(text.matchAll(entryRegex));

  if (matches.length < 5) {
    return [];
  }

  return matches
    .map((match, index) => {
      const next = matches[index + 1];
      const start = (match.index || 0) + match[0].length;
      const end = next?.index ?? text.length;
      const title = normalizeWesternEntryTitle(match[1]);
      const body = cleanWesternEntryBody(text.slice(start, end));

      return [title, body].filter(Boolean).join('\n');
    })
    .filter((entry) => entry.length >= 30);
}

function splitWesternInlineUppercaseEntries(text: string): string[] {
  const normalizedText = text.replace(
    /(?<=\.)\s+([A-Z][A-Z0-9 '&-]{1,70}(?:(?:,\s+|\s+)(?:OR|or)\s+[A-Z][A-Z0-9 '&-]{1,70})?)\.\s+/g,
    '\n$1. '
  );
  const entryRegex =
    /(?:^|\n)([A-Z][A-Z0-9 '&-]{1,70}(?:(?:,\s+|\s+)(?:OR|or)\s+[A-Z][A-Z0-9 '&-]{1,70})?)\.\s+/g;
  const matches = Array.from(normalizedText.matchAll(entryRegex));

  if (matches.length < 5) {
    return [];
  }

  return matches
    .map((match, index) => {
      const next = matches[index + 1];
      const start = (match.index || 0) + match[0].length;
      const end = next?.index ?? normalizedText.length;
      const title = normalizeWesternEntryTitle(match[1]);
      const body = cleanWesternEntryBody(normalizedText.slice(start, end));

      return [title, body].filter(Boolean).join('\n');
    })
    .filter((entry) => entry.length >= 30);
}

function splitWesternEntries(text: string): string[] {
  const dashEntries = splitWesternDashEntries(text);
  if (dashEntries.length >= 5) {
    return dashEntries
      .flatMap((entry) => splitLongEntry(entry))
      .filter((entry) => entry.length >= 30);
  }

  const inlineEntries = splitWesternInlineUppercaseEntries(text);
  if (inlineEntries.length >= 5) {
    return inlineEntries
      .flatMap((entry) => splitLongEntry(entry))
      .filter((entry) => entry.length >= 30);
  }

  const lines = text.split('\n');
  const entries: string[] = [];
  let currentHeading = '';
  let currentBody: string[] = [];

  function flush() {
    const body = currentBody.join('\n').trim();
    if (currentHeading || body) {
      entries.push([currentHeading, body].filter(Boolean).join('\n').trim());
    }
    currentBody = [];
  }

  for (const line of lines) {
    if (isWesternEntryHeading(line)) {
      flush();
      currentHeading = line.trim();
      continue;
    }

    currentBody.push(line);
  }

  flush();

  if (entries.length >= 5) {
    return entries
      .flatMap((entry) => splitLongEntry(entry))
      .filter((entry) => entry.length >= 30);
  }

  return text
    .split(/\n{2,}/)
    .flatMap((paragraph) => splitLongEntry(paragraph.trim()))
    .filter((entry) => entry.length >= 30);
}

function splitGenericEntries(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .flatMap((paragraph) => splitLongEntry(paragraph.trim()))
    .filter((entry) => entry.length >= 30);
}

function splitPreparedEntries(
  text: string
): Array<{ text: string; title: string; start: number; end: number }> {
  const headingMatches = Array.from(
    text.matchAll(/(?:^|\n)([^\n]+)\n(?=(?:Aliases|Source):)/g)
  );

  if (headingMatches.length < 3) {
    return [];
  }

  const entries = headingMatches
    .map((match, index) => {
      const start = (match.index || 0) + (match[0].startsWith('\n') ? 1 : 0);
      const nextMatch = headingMatches[index + 1];
      const end =
        nextMatch === undefined
          ? text.length
          : (nextMatch.index || 0) + (nextMatch[0].startsWith('\n') ? 1 : 0);

      return {
        text: text.slice(start, end).trim(),
        title: match[1].trim().slice(0, 120),
        start,
        end,
      };
    })
    .filter((entry) =>
      /^(?:Aliases|Source|Category|Meaning|Content|Note):/m.test(entry.text)
    );

  if (entries.length < 3 || entries.length < headingMatches.length * 0.8) {
    return [];
  }

  return entries;
}

function splitLongTheorySentence(sentence: string): string[] {
  const words = sentence.split(/\s+/).filter(Boolean);

  if (words.length <= THEORY_MAX_WORDS) {
    return [sentence];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + THEORY_WINDOW_WORDS, words.length);
    chunks.push(words.slice(start, end).join(' '));

    if (end >= words.length) {
      break;
    }

    start = Math.max(end - THEORY_OVERLAP_WORDS, start + 1);
  }

  return chunks;
}

function theoryOverlapTail(sentences: string[]): string[] {
  const tail: string[] = [];
  let words = 0;

  for (let index = sentences.length - 1; index >= 0; index -= 1) {
    const sentence = sentences[index];
    tail.unshift(sentence);
    words += countWords(sentence);

    if (words >= THEORY_OVERLAP_WORDS) {
      break;
    }
  }

  return tail;
}

function findChunkPosition(
  fullText: string,
  chunkText: string,
  fromIndex: number
): { start: number; end: number } {
  const needle = chunkText.slice(0, Math.min(chunkText.length, 80));
  const searchFrom = Math.max(0, fromIndex - 2000);
  const start = fullText.indexOf(needle, searchFrom);
  const safeStart = start >= 0 ? start : fromIndex;

  return {
    start: safeStart,
    end: safeStart + chunkText.length,
  };
}

function splitTheoryWindows(
  text: string
): Array<{ text: string; start: number; end: number }> {
  const sentences = splitTheorySentences(text).flatMap((sentence) =>
    splitLongTheorySentence(sentence)
  );
  const chunks: string[] = [];
  let current: string[] = [];
  let currentWords = 0;
  let hasNewContent = false;

  for (const sentence of sentences) {
    const sentenceWords = countWords(sentence);

    if (
      current.length > 0 &&
      currentWords >= THEORY_MIN_WORDS &&
      currentWords + sentenceWords > THEORY_WINDOW_WORDS
    ) {
      chunks.push(current.join(' '));
      current = theoryOverlapTail(current);
      currentWords = countWords(current.join(' '));
      hasNewContent = false;

      if (currentWords + sentenceWords > THEORY_MAX_WORDS) {
        current = [];
        currentWords = 0;
      }
    }

    current.push(sentence);
    currentWords += sentenceWords;
    hasNewContent = true;

    if (currentWords >= THEORY_MAX_WORDS) {
      chunks.push(current.join(' '));
      current = theoryOverlapTail(current);
      currentWords = countWords(current.join(' '));
      hasNewContent = false;
    }
  }

  if (current.length > 0 && hasNewContent) {
    chunks.push(current.join(' '));
  }

  if (
    chunks.length >= 2 &&
    countWords(chunks[chunks.length - 1]) < THEORY_MIN_WORDS &&
    countWords(chunks[chunks.length - 2]) +
      countWords(chunks[chunks.length - 1]) <=
      THEORY_MAX_WORDS
  ) {
    const tail = chunks.pop();
    chunks[chunks.length - 1] = `${chunks[chunks.length - 1]} ${tail}`.trim();
  }

  let cursor = 0;

  return chunks.map((chunk) => {
    const position = findChunkPosition(text, chunk, cursor);
    cursor = position.end;

    return {
      text: chunk,
      start: position.start,
      end: position.end,
    };
  });
}

function findEntryPosition(
  fullText: string,
  entry: string,
  fromIndex: number
): { start: number; end: number } {
  const start = fullText.indexOf(
    entry.slice(0, Math.min(entry.length, 80)),
    fromIndex
  );
  const safeStart = start >= 0 ? start : fromIndex;

  return {
    start: safeStart,
    end: safeStart + entry.length,
  };
}

export function chunkByDreamProfile(
  cleanText: string,
  sourceConfig: SourceManifestEntry,
  cleanReport: CleanTextReport
): DreamChunk[] {
  if (!cleanText.trim()) {
    return [];
  }

  const preparedEntries = splitPreparedEntries(cleanText);
  if (preparedEntries.length > 0) {
    return preparedEntries.map((entry, index) =>
      createChunk({
        text: entry.text,
        chunkId: index,
        sourceConfig,
        cleanReport,
        start: entry.start,
        end: entry.end,
        sectionTitle: entry.title,
        sectionPath: `${sourceConfig.title} > ${entry.title}`,
      })
    );
  }

  if (sourceConfig.chunkProfile === 'theory_sliding_window') {
    return splitTheoryWindows(cleanText).map((window, index) =>
      createChunk({
        text: window.text,
        chunkId: index,
        sourceConfig,
        cleanReport,
        start: window.start,
        end: window.end,
        sectionPath: sourceConfig.title,
      })
    );
  }

  const entries =
    sourceConfig.chunkProfile === 'chinese_symbol_dictionary'
      ? splitChineseEntries(cleanText)
      : sourceConfig.chunkProfile === 'western_symbol_dictionary'
        ? splitWesternEntries(cleanText)
        : splitGenericEntries(cleanText);
  const chunks: DreamChunk[] = [];
  let cursor = 0;

  for (const entry of entries) {
    const position = findEntryPosition(cleanText, entry, cursor);
    cursor = position.end;

    chunks.push(
      createChunk({
        text: entry,
        chunkId: chunks.length,
        sourceConfig,
        cleanReport,
        start: position.start,
        end: position.end,
      })
    );
  }

  return chunks;
}
