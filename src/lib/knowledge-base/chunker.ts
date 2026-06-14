export interface TextChunk {
  text: string;
  start: number;
  end: number;
  chunkId: number;
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number
): number {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getChunkingConfig() {
  return {
    chunkSize: parsePositiveInteger(process.env.KNOWLEDGE_CHUNK_SIZE, 1024),
    overlap: parsePositiveInteger(process.env.KNOWLEDGE_CHUNK_OVERLAP, 120),
    minChunkSize: parsePositiveInteger(
      process.env.KNOWLEDGE_MIN_CHUNK_SIZE,
      100
    ),
  };
}

function findBestBreak(windowText: string, minChunkSize: number): number {
  const patterns = [
    /\n{2,}/g,
    /\n/g,
    /[。！？.!?；;]\s+/g,
    /[,，:：]\s*/g,
    /\s+/g,
  ];

  for (const pattern of patterns) {
    let bestIndex = -1;

    for (const match of windowText.matchAll(pattern)) {
      const candidate = match.index ?? -1;
      if (candidate >= minChunkSize) {
        bestIndex = candidate + match[0].length;
      }
    }

    if (bestIndex !== -1) {
      return bestIndex;
    }
  }

  return windowText.length;
}

/**
 * Split text into overlapping chunks.
 *
 * The previous implementation only split on `\n\n`, which breaks on CRLF files
 * and can accidentally turn an entire book into a single chunk. This version:
 * 1. normalizes CRLF to LF
 * 2. prefers semantic breakpoints
 * 3. always enforces an upper bound on chunk size
 */
export function chunkText(
  text: string,
  chunkSize: number = 1024,
  overlap: number = 120,
  minChunkSize: number = 100
): TextChunk[] {
  const normalizedChunkSize = Math.max(1, chunkSize);
  const normalizedOverlap = Math.max(
    0,
    Math.min(overlap, normalizedChunkSize - 1)
  );
  const normalizedMinChunkSize = Math.max(
    1,
    Math.min(minChunkSize, normalizedChunkSize)
  );

  // Normalize CRLF/CR to LF before any paragraph logic.
  text = text.replace(/\r\n?/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]{2,}/g, ' ');
  text = text.trim();

  if (!text) {
    return [];
  }

  const chunks: TextChunk[] = [];
  let start = 0;

  while (start < text.length) {
    const maxEnd = Math.min(start + normalizedChunkSize, text.length);
    const windowText = text.slice(start, maxEnd);
    const relativeEnd =
      maxEnd < text.length
        ? findBestBreak(
            windowText,
            Math.min(normalizedMinChunkSize, windowText.length)
          )
        : windowText.length;
    const safeRelativeEnd = Math.max(
      1,
      Math.min(relativeEnd, windowText.length)
    );
    const end = start + safeRelativeEnd;
    const chunkText = text.slice(start, end).trim();

    if (chunkText.length >= normalizedMinChunkSize || end >= text.length) {
      chunks.push({
        text: chunkText,
        start,
        end,
        chunkId: chunks.length,
      });
    }

    if (end >= text.length) {
      break;
    }

    const effectiveOverlap = Math.min(
      normalizedOverlap,
      Math.max(0, safeRelativeEnd - normalizedMinChunkSize)
    );
    start = end - effectiveOverlap;
  }

  return chunks;
}
