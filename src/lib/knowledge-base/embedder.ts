const SILICONFLOW_BASE_URL =
  process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn';
const EMBEDDING_MODEL =
  process.env.EMBEDDING_MODEL || 'Qwen/Qwen3-Embedding-8B';
const EMBEDDING_DIMENSION = Number.parseInt(
  process.env.EMBEDDING_DIMENSION || '4096',
  10
);

interface EmbeddingResponse {
  data?: Array<{
    embedding: number[];
    index?: number;
  }>;
  error?: {
    message?: string;
  };
  message?: string;
  code?: string;
}

class EmbeddingRequestError extends Error {
  status: number;
  retryable: boolean;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'EmbeddingRequestError';
    this.status = status;
    this.retryable = [408, 409, 429, 500, 502, 503, 504].includes(status);
  }
}

const EMBEDDING_BATCH_SIZE = Number.parseInt(
  process.env.KNOWLEDGE_EMBED_BATCH_SIZE || '16',
  10
);
const EMBEDDING_RETRY_COUNT = Number.parseInt(
  process.env.KNOWLEDGE_EMBED_RETRY_COUNT || '3',
  10
);
const EMBEDDING_RETRY_BASE_DELAY_MS = Number.parseInt(
  process.env.KNOWLEDGE_EMBED_RETRY_BASE_DELAY_MS || '800',
  10
);
const EMBEDDING_TIMEOUT_MS = Number.parseInt(
  process.env.KNOWLEDGE_EMBED_TIMEOUT_MS || '60000',
  10
);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getApiKey() {
  const apiKey = process.env.SILICONFLOW_API_KEY;
  if (!apiKey) {
    throw new Error(
      'SILICONFLOW_API_KEY is not configured. Set SiliconFlow env vars before processing knowledge files.'
    );
  }

  return apiKey;
}

function getEmbeddingEndpoint(): string {
  const normalizedBaseUrl = SILICONFLOW_BASE_URL.replace(/\/+$/, '');
  return normalizedBaseUrl.endsWith('/v1')
    ? `${normalizedBaseUrl}/embeddings`
    : `${normalizedBaseUrl}/v1/embeddings`;
}

async function requestEmbeddings(texts: string[]): Promise<number[][]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EMBEDDING_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(getEmbeddingEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: texts,
        encoding_format: 'float',
        dimensions: EMBEDDING_DIMENSION,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new EmbeddingRequestError(
        `SiliconFlow embedding request timed out after ${EMBEDDING_TIMEOUT_MS}ms`,
        408
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const payload = (await response.json()) as EmbeddingResponse;

  if (!response.ok) {
    const payloadText = JSON.stringify(payload).slice(0, 500);
    throw new EmbeddingRequestError(
      payload.error?.message ||
        payload.message ||
        payload.code ||
        `SiliconFlow embedding request failed: ${response.status} ${payloadText}`,
      response.status
    );
  }

  const embeddings = [...(payload.data || [])]
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((item) => item.embedding);

  if (embeddings.length !== texts.length) {
    throw new Error(
      `SiliconFlow returned ${embeddings.length} embeddings for ${texts.length} inputs`
    );
  }

  if (embeddings.some((embedding) => !embedding?.length)) {
    throw new Error('SiliconFlow returned an empty embedding');
  }

  return embeddings;
}

async function requestEmbeddingsWithRetry(
  texts: string[],
  attempt: number = 0
): Promise<number[][]> {
  try {
    return await requestEmbeddings(texts);
  } catch (error) {
    if (
      error instanceof EmbeddingRequestError &&
      error.retryable &&
      attempt < EMBEDDING_RETRY_COUNT
    ) {
      const delayMs =
        EMBEDDING_RETRY_BASE_DELAY_MS * 2 ** attempt +
        Math.floor(Math.random() * 250);
      await sleep(delayMs);
      return requestEmbeddingsWithRetry(texts, attempt + 1);
    }

    if (
      texts.length > 1 &&
      !(
        error instanceof EmbeddingRequestError &&
        [401, 403].includes(error.status)
      )
    ) {
      const middle = Math.ceil(texts.length / 2);
      const left = await requestEmbeddingsWithRetry(texts.slice(0, middle));
      const right = await requestEmbeddingsWithRetry(texts.slice(middle));
      return [...left, ...right];
    }

    throw error;
  }
}

/**
 * Generate embedding for a single text using SiliconFlow.
 */
export async function embedText(text: string): Promise<number[]> {
  if (!text.trim()) {
    throw new Error('Text cannot be empty');
  }

  const [embedding] = await requestEmbeddingsWithRetry([text]);

  if (embedding.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Expected embedding dimension ${EMBEDDING_DIMENSION}, got ${embedding.length}`
    );
  }

  return embedding;
}

/**
 * Generate embeddings for multiple texts using SiliconFlow.
 */
export async function embedBatch(
  texts: string[],
  onProgress?: (current: number, total: number) => void
): Promise<number[][]> {
  if (texts.length === 0) {
    throw new Error('Texts array cannot be empty');
  }

  const invalidIndex = texts.findIndex((text) => !text.trim());
  if (invalidIndex !== -1) {
    throw new Error(`Text at index ${invalidIndex} is empty`);
  }

  const embeddings: number[][] = [];
  const batchSize = Math.max(1, EMBEDDING_BATCH_SIZE);

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchEmbeddings = await requestEmbeddingsWithRetry(batch);
    embeddings.push(...batchEmbeddings);

    if (onProgress) {
      onProgress(embeddings.length, texts.length);
    }
  }

  for (const embedding of embeddings) {
    if (embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(
        `Expected embedding dimension ${EMBEDDING_DIMENSION}, got ${embedding.length}`
      );
    }
  }

  return embeddings;
}

export function getConfiguredEmbeddingDimension(): number {
  return EMBEDDING_DIMENSION;
}

export function getConfiguredEmbeddingModel(): string {
  return EMBEDDING_MODEL;
}
