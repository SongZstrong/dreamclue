function normalizeText(text: string): string {
  return text.replace(/\r\n?/g, '\n').replace(/\s+/g, ' ').trim().toLowerCase();
}

function tokenizeChineseSegment(segment: string): string[] {
  const tokens = new Set<string>();

  for (let i = 0; i < segment.length; i++) {
    tokens.add(segment[i]);
  }

  for (let i = 0; i < segment.length - 1; i++) {
    tokens.add(segment.slice(i, i + 2));
  }

  if (segment.length <= 4) {
    tokens.add(segment);
  }

  return Array.from(tokens);
}

export function buildSearchTokens(text: string): string[] {
  const normalized = normalizeText(text);
  const tokens = new Set<string>();

  for (const word of normalized.match(/[a-z0-9]+/g) || []) {
    if (word.length >= 2) {
      tokens.add(word);
    }
  }

  for (const segment of normalized.match(/[\u4e00-\u9fff]+/g) || []) {
    for (const token of tokenizeChineseSegment(segment)) {
      tokens.add(token);
    }
  }

  return Array.from(tokens);
}
