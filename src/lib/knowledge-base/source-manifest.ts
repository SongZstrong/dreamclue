export type KnowledgeSourceType =
  | 'chinese_traditional'
  | 'western_traditional'
  | 'psychoanalytic'
  | 'modern_sleep_science'
  | 'curated_symbol';

export type ParserProfile =
  | 'ctext'
  | 'gutenberg'
  | 'wikisource'
  | 'plain'
  | 'epub'
  | 'pdf'
  | 'curated';

export type ChunkProfile =
  | 'chinese_symbol_dictionary'
  | 'western_symbol_dictionary'
  | 'theory_sliding_window'
  | 'curated_symbol_dictionary'
  | 'generic_dream_text';

export interface SourceManifestEntry {
  fileName: string;
  title: string;
  sourceType: KnowledgeSourceType;
  language: 'zh' | 'en' | 'mixed';
  license: string;
  copyrightStatus: string;
  sourceUrl?: string;
  sourceWeight: number;
  parserProfile: ParserProfile;
  chunkProfile: ChunkProfile;
  metadata?: Record<string, unknown>;
}

export const PARSER_VERSION = 'v3-cleaner-2026-06-19';
export const CHUNKER_VERSION = 'v4-dream-chunker-2026-06-20';

const MANIFEST: SourceManifestEntry[] = [
  {
    fileName: 'fontaine_golden_wheel.txt',
    title: 'The Golden Wheel Dream-book and Fortune-teller',
    sourceType: 'western_traditional',
    language: 'en',
    license: 'public_domain_us',
    copyrightStatus: 'public_domain',
    sourceUrl: 'https://www.gutenberg.org/ebooks/60045',
    sourceWeight: 0.85,
    parserProfile: 'gutenberg',
    chunkProfile: 'western_symbol_dictionary',
  },
  {
    fileName: 'fontaine_golden_wheel.epub',
    title: 'The Golden Wheel Dream-book and Fortune-teller',
    sourceType: 'western_traditional',
    language: 'en',
    license: 'public_domain_us',
    copyrightStatus: 'public_domain',
    sourceUrl: 'https://www.gutenberg.org/ebooks/60045',
    sourceWeight: 0.85,
    parserProfile: 'gutenberg',
    chunkProfile: 'western_symbol_dictionary',
  },
  {
    fileName: 'anonymous_fortune_telling.txt',
    title: 'Fortune-Telling by Cards and Dreams',
    sourceType: 'western_traditional',
    language: 'en',
    license: 'public_domain_us',
    copyrightStatus: 'public_domain',
    sourceWeight: 0.75,
    parserProfile: 'gutenberg',
    chunkProfile: 'western_symbol_dictionary',
  },
  {
    fileName: 'anonymous_fortune_telling.epub',
    title: 'Fortune-Telling by Cards and Dreams',
    sourceType: 'western_traditional',
    language: 'en',
    license: 'public_domain_us',
    copyrightStatus: 'public_domain',
    sourceWeight: 0.75,
    parserProfile: 'gutenberg',
    chunkProfile: 'western_symbol_dictionary',
  },
  {
    fileName: 'miller_ten_thousand_dreams.txt',
    title: 'Ten Thousand Dreams Interpreted',
    sourceType: 'western_traditional',
    language: 'en',
    license: 'public_domain_us',
    copyrightStatus: 'public_domain',
    sourceWeight: 0.9,
    parserProfile: 'plain',
    chunkProfile: 'western_symbol_dictionary',
  },
  {
    fileName: '周公解梦_维基文库.txt',
    title: '周公解梦',
    sourceType: 'chinese_traditional',
    language: 'zh',
    license: 'public_domain_or_wikisource',
    copyrightStatus: 'public_domain',
    sourceWeight: 0.85,
    parserProfile: 'wikisource',
    chunkProfile: 'chinese_symbol_dictionary',
  },
  {
    fileName: '周公解梦_CText.txt',
    title: '周公解梦',
    sourceType: 'chinese_traditional',
    language: 'zh',
    license: 'public_domain_or_ctext',
    copyrightStatus: 'public_domain',
    sourceWeight: 0.85,
    parserProfile: 'ctext',
    chunkProfile: 'chinese_symbol_dictionary',
  },
  {
    fileName: '周公解梦_完整版.txt',
    title: '周公解梦',
    sourceType: 'chinese_traditional',
    language: 'zh',
    license: 'public_domain_or_user_supplied',
    copyrightStatus: 'public_domain',
    sourceWeight: 0.8,
    parserProfile: 'plain',
    chunkProfile: 'chinese_symbol_dictionary',
  },
  {
    fileName: 'mengzhan_yizhi.pdf',
    title: '梦占逸旨',
    sourceType: 'chinese_traditional',
    language: 'zh',
    license: 'public_domain_or_user_supplied',
    copyrightStatus: 'public_domain',
    sourceWeight: 0.82,
    parserProfile: 'pdf',
    chunkProfile: 'chinese_symbol_dictionary',
  },
  {
    fileName: 'freud_interpretation_of_dreams.txt',
    title: 'The Interpretation of Dreams',
    sourceType: 'psychoanalytic',
    language: 'en',
    license: 'public_domain_us',
    copyrightStatus: 'public_domain',
    sourceUrl: 'https://www.gutenberg.org/ebooks/66048',
    sourceWeight: 1,
    parserProfile: 'gutenberg',
    chunkProfile: 'theory_sliding_window',
  },
  {
    fileName: 'freud_interpretation_dreams.epub',
    title: 'The Interpretation of Dreams',
    sourceType: 'psychoanalytic',
    language: 'en',
    license: 'public_domain_us',
    copyrightStatus: 'public_domain',
    sourceUrl: 'https://www.gutenberg.org/ebooks/66048',
    sourceWeight: 1,
    parserProfile: 'gutenberg',
    chunkProfile: 'theory_sliding_window',
  },
  {
    fileName: 'freud_dream_psychology.txt',
    title: 'Dream Psychology',
    sourceType: 'psychoanalytic',
    language: 'en',
    license: 'public_domain_us',
    copyrightStatus: 'public_domain',
    sourceUrl: 'https://www.gutenberg.org/ebooks/15489',
    sourceWeight: 0.95,
    parserProfile: 'gutenberg',
    chunkProfile: 'theory_sliding_window',
  },
  {
    fileName: 'freud_dream_psychology.epub',
    title: 'Dream Psychology',
    sourceType: 'psychoanalytic',
    language: 'en',
    license: 'public_domain_us',
    copyrightStatus: 'public_domain',
    sourceUrl: 'https://www.gutenberg.org/ebooks/15489',
    sourceWeight: 0.95,
    parserProfile: 'gutenberg',
    chunkProfile: 'theory_sliding_window',
  },
];

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_\-\s]+/g, ' ')
    .trim();
}

function inferSourceConfig(
  fileName: string,
  title?: string
): SourceManifestEntry {
  const combined = normalizeKey(`${fileName} ${title || ''}`);
  const hasChinese = /[\u4e00-\u9fff]/.test(combined);

  if (
    combined.includes('freud') ||
    combined.includes('jung') ||
    combined.includes('psychoanalysis') ||
    combined.includes('psychology')
  ) {
    return {
      fileName,
      title: title || fileName,
      sourceType: 'psychoanalytic',
      language: hasChinese ? 'mixed' : 'en',
      license: 'user_supplied',
      copyrightStatus: 'unknown',
      sourceWeight: 0.9,
      parserProfile: 'plain',
      chunkProfile: 'theory_sliding_window',
    };
  }

  if (
    combined.includes('curated') ||
    combined.includes('symbol') ||
    combined.includes('意象')
  ) {
    return {
      fileName,
      title: title || fileName,
      sourceType: 'curated_symbol',
      language: hasChinese ? 'zh' : 'en',
      license: 'user_supplied',
      copyrightStatus: 'unknown',
      sourceWeight: 1.1,
      parserProfile: 'curated',
      chunkProfile: 'curated_symbol_dictionary',
    };
  }

  if (
    hasChinese ||
    combined.includes('zhougong') ||
    combined.includes('ctext')
  ) {
    return {
      fileName,
      title: title || fileName,
      sourceType: 'chinese_traditional',
      language: 'zh',
      license: 'user_supplied',
      copyrightStatus: 'unknown',
      sourceWeight: 0.8,
      parserProfile: combined.includes('wikisource') ? 'wikisource' : 'plain',
      chunkProfile: 'chinese_symbol_dictionary',
    };
  }

  return {
    fileName,
    title: title || fileName,
    sourceType: 'western_traditional',
    language: 'en',
    license: 'user_supplied',
    copyrightStatus: 'unknown',
    sourceWeight: 0.75,
    parserProfile: 'plain',
    chunkProfile: 'western_symbol_dictionary',
  };
}

export function getSourceConfigForFile(
  fileName: string,
  title?: string | null
): SourceManifestEntry {
  const fileKey = normalizeKey(fileName);
  const titleKey = normalizeKey(title || '');
  const matched = MANIFEST.find((entry) => {
    const entryFileKey = normalizeKey(entry.fileName);
    const entryTitleKey = normalizeKey(entry.title);

    return (
      fileKey === entryFileKey ||
      titleKey === entryTitleKey ||
      (titleKey.length > 0 && titleKey.includes(entryTitleKey)) ||
      fileKey.includes(entryFileKey)
    );
  });

  if (matched) {
    return matched;
  }

  return inferSourceConfig(fileName, title || undefined);
}

export function getSourceManifest(): SourceManifestEntry[] {
  return MANIFEST;
}
