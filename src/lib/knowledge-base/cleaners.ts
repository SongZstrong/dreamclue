import type { SourceManifestEntry } from './source-manifest';

export interface CleanTextReport {
  cleanText: string;
  rawChars: number;
  cleanChars: number;
  removedBlocks: number;
  noiseRatio: number;
  warnings: string[];
}

export interface ChunkQuality {
  qualityScore: number;
  isActive: boolean;
  warnings: string[];
}

const GUTENBERG_PATTERNS = [
  /\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[\s\S]*?\*\*\*/i,
  /\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[\s\S]*$/i,
  /End of Project Gutenberg[\s\S]+$/i,
  /Produced by [\s\S]+?(?=\n\n)/gi,
  /Transcriber's Note[\s\S]*?(?=\n{2,}[A-Z][^\n]{0,80}\n)/gi,
];

const WIKISOURCE_NOISE = [
  '维基文库，自由的图书馆',
  '姊妹计划',
  '数据项',
  '导航菜单',
  '个人工具',
  '命名空间',
  '页面',
  '讨论',
  '阅读',
  '查看源代码',
  '查看历史',
  '工具',
  '打印/导出',
  '其他项目',
  'Wikisource',
  'Creative Commons',
];

const COPYRIGHT_OR_AD_PATTERNS = [
  /^\s*(copyright|all rights reserved|terms of use)\b/i,
  /^\s*(price|net price|publisher|advertisement|catalogue)\b/i,
  /^\s*(售价|价格|广告|版权|版权所有|出版|发行)\b/,
  /^\s*\$?\d+(?:\.\d{2})?\s*$/i,
  /^\s*isbn\b/i,
];

function removePatternBlocks(text: string, patterns: RegExp[]) {
  let removedBlocks = 0;
  let nextText = text;

  for (const pattern of patterns) {
    nextText = nextText.replace(pattern, (match) => {
      if (match.trim()) {
        removedBlocks += 1;
      }
      return '\n\n';
    });
  }

  return { text: nextText, removedBlocks };
}

function normalizeMojibake(text: string): string {
  return text
    .split('\0')
    .join('')
    .replace(/[�]{2,}/g, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .replace(/([A-Za-z])-\n([a-z])/g, '$1$2')
    .replace(/\r\n?/g, '\n');
}

function looksLikeNavigationLine(line: string): boolean {
  const trimmed = line.trim();

  if (!trimmed) {
    return false;
  }

  if (WIKISOURCE_NOISE.some((noise) => trimmed.includes(noise))) {
    return true;
  }

  if (COPYRIGHT_OR_AD_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return true;
  }

  if (/^[-=_*]{3,}$/.test(trimmed)) {
    return true;
  }

  if (/^(\d+\s*){4,}$/.test(trimmed)) {
    return true;
  }

  const punctuationOnly = trimmed.replace(/[\p{P}\p{S}\s]/gu, '');
  return punctuationOnly.length === 0 && trimmed.length > 2;
}

function looksLikeTocLine(line: string): boolean {
  const trimmed = line.trim();

  if (trimmed.length > 90) {
    return false;
  }

  return (
    /^chapter\s+[ivxlcdm\d]+\.?$/i.test(trimmed) ||
    /^第[一二三四五六七八九十百\d]+[章节卷回篇]/.test(trimmed) ||
    /\.{3,}\s*\d+$/.test(trimmed) ||
    /^[A-Z][A-Z\s,'-]{2,}\s+\d{1,4}$/.test(trimmed)
  );
}

function cleanLines(text: string, sourceConfig: SourceManifestEntry) {
  const lines = text.split('\n');
  const kept: string[] = [];
  let removedBlocks = 0;
  let shortLineRun = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (looksLikeNavigationLine(trimmed)) {
      removedBlocks += 1;
      continue;
    }

    if (
      (sourceConfig.parserProfile === 'wikisource' ||
        sourceConfig.parserProfile === 'ctext') &&
      looksLikeTocLine(trimmed)
    ) {
      removedBlocks += 1;
      continue;
    }

    if (trimmed.length > 0 && trimmed.length <= 2) {
      shortLineRun += 1;
      if (shortLineRun >= 6) {
        removedBlocks += 1;
        continue;
      }
    } else {
      shortLineRun = 0;
    }

    kept.push(line);
  }

  return {
    text: kept.join('\n'),
    removedBlocks,
  };
}

function normalizeParagraphs(text: string): string {
  return text
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function removeAfterLateMarker(text: string, marker: RegExp): string {
  const matches = Array.from(text.matchAll(marker));
  const lastMatch = matches.at(-1);

  if (!lastMatch || lastMatch.index === undefined) {
    return text;
  }

  if (lastMatch.index < text.length * 0.45) {
    return text;
  }

  return text.slice(0, lastMatch.index).trim();
}

function cleanPsychoanalyticText(text: string): string {
  let nextText = text
    .replace(
      /CONTENTS\s+CHAPTER\s+PAGE[\s\S]*?(DREAM PSYCHOLOGY\s+I\s+DREAMS HAVE A MEANING)/i,
      '$1'
    )
    .replace(
      /CONTENTS\s+CHAP\.\s+PAGE[\s\S]*?(THE INTERPRETATION OF DREAMS\s+I\s+THE SCIENTIFIC LITERATURE)/i,
      '$1'
    )
    .replace(
      /The\s+Project\s+Gutenberg\s+eBook\s+of\s+Dream\s+Psychology:\s+Psychoanalysis\s+for\s+Beginners(?:,\s+by\s+Sigmund\s+Freud)?/gi,
      ''
    )
    .replace(
      /The\s+Project\s+Gutenberg\s+eBook\s+of\s+The\s+Interpretation\s+of\s+Dreams(?:,\s+by\s+Sigmund\s+Freud)?/gi,
      ''
    );

  nextText = removeAfterLateMarker(nextText, /\bLITERARY INDEX\b/gi);
  nextText = removeAfterLateMarker(nextText, /\bINDEX\s+Abraham,\s*K\./gi);
  nextText = removeAfterLateMarker(nextText, /\bTRANSCRIBER[’']?S NOTES\b/gi);

  return nextText;
}

function cleanWesternTraditionalText(
  text: string,
  sourceConfig: SourceManifestEntry
): string {
  let nextText = text;
  const sourceKey =
    `${sourceConfig.fileName} ${sourceConfig.title}`.toLowerCase();

  if (sourceKey.includes('golden wheel')) {
    const startMarker = 'ABOVE. To dream you see any thing hanging';
    const endMarker = 'LIST OF DREAMS, WITHOUT INTERPRETATIONS';
    const startIndex = nextText.indexOf(startMarker);

    if (startIndex >= 0) {
      nextText = nextText.slice(startIndex);
    }

    const endIndex = nextText.indexOf(endMarker);

    if (endIndex >= 0) {
      nextText = nextText.slice(0, endIndex);
    }
  }

  return nextText;
}

function countSuspiciousChars(text: string): number {
  const matches = text.match(/[�□■◆◇�]/g);
  return matches?.length || 0;
}

export function cleanTextBySource(
  rawText: string,
  sourceConfig: SourceManifestEntry
): CleanTextReport {
  const warnings: string[] = [];
  const rawChars = rawText.length;
  let removedBlocks = 0;
  let text = normalizeMojibake(rawText);

  const blockResult = removePatternBlocks(text, GUTENBERG_PATTERNS);
  text = blockResult.text;
  removedBlocks += blockResult.removedBlocks;

  if (sourceConfig.sourceType === 'psychoanalytic') {
    text = cleanPsychoanalyticText(text);
  }

  if (sourceConfig.sourceType === 'western_traditional') {
    text = cleanWesternTraditionalText(text, sourceConfig);
  }

  const lineResult = cleanLines(text, sourceConfig);
  text = normalizeParagraphs(lineResult.text);
  removedBlocks += lineResult.removedBlocks;

  const suspiciousChars = countSuspiciousChars(text);
  if (suspiciousChars > 0) {
    warnings.push(`Suspicious OCR characters: ${suspiciousChars}`);
  }

  const cleanChars = text.length;
  const noiseRatio =
    rawChars === 0 ? 0 : Math.max(0, 1 - cleanChars / Math.max(rawChars, 1));

  if (noiseRatio > 0.35) {
    warnings.push(`High removed-noise ratio: ${noiseRatio.toFixed(2)}`);
  }

  if (cleanChars < rawChars * 0.2 && rawChars > 1000) {
    warnings.push('Cleaned text is much shorter than raw text');
  }

  return {
    cleanText: text,
    rawChars,
    cleanChars,
    removedBlocks,
    noiseRatio,
    warnings,
  };
}

export function scoreChunkQuality(text: string): ChunkQuality {
  const trimmed = text.trim();
  const warnings: string[] = [];

  if (!trimmed) {
    return {
      qualityScore: 0,
      isActive: false,
      warnings: ['empty chunk'],
    };
  }

  let score = 1;

  if (trimmed.length < 30) {
    score -= 0.35;
    warnings.push('very short chunk');
  }

  const suspiciousCount = countSuspiciousChars(trimmed);
  if (suspiciousCount > 0) {
    score -= Math.min(0.4, suspiciousCount / Math.max(trimmed.length, 1));
    warnings.push('contains OCR replacement characters');
  }

  const alphaNumericOrCjk = trimmed.match(/[a-zA-Z0-9\u4e00-\u9fff]/g) || [];
  const signalRatio = alphaNumericOrCjk.length / Math.max(trimmed.length, 1);
  if (signalRatio < 0.35) {
    score -= 0.45;
    warnings.push('low text signal ratio');
  }

  const lines = trimmed.split('\n').filter(Boolean);
  const shortLines = lines.filter((line) => line.trim().length <= 4).length;
  if (lines.length >= 6 && shortLines / lines.length > 0.65) {
    score -= 0.35;
    warnings.push('directory-like short-line block');
  }

  const normalizedScore = Math.max(0, Math.min(1, Number(score.toFixed(3))));

  return {
    qualityScore: normalizedScore,
    isActive: normalizedScore >= 0.45,
    warnings,
  };
}
