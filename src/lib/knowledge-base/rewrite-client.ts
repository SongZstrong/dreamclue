import type { QueryIntent } from './query-types';

const BAILIAN_BASE_URL =
  process.env.BAILIAN_BASE_URL || 'https://dashscope.aliyuncs.com';
const CHAT_DEFAULT_MODEL = process.env.CHAT_DEFAULT_MODEL || 'qwen3-max';

export interface LlmRewriteOutput {
  normalizedQuery: string;
  dreamSymbols: string[];
  emotions: string[];
  sourceHints: string[];
  expandedQueries: string[];
  lexicalQueries: string[];
  intentHint: QueryIntent;
  confidence: number;
}

interface ChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
  message?: string;
}

function getRewriteApiKey(): string | null {
  return process.env.BAILIAN_API_KEY || null;
}

function getRewriteEndpoint(): string {
  const normalizedBaseUrl = BAILIAN_BASE_URL.replace(/\/+$/, '');
  return normalizedBaseUrl.endsWith('/compatible-mode/v1')
    ? `${normalizedBaseUrl}/chat/completions`
    : `${normalizedBaseUrl}/compatible-mode/v1/chat/completions`;
}

function extractJsonObject(text: string): string | null {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  return text.slice(firstBrace, lastBrace + 1);
}

export async function rewriteQueryWithLlm({
  query,
  locale,
  history,
}: {
  query: string;
  locale: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}): Promise<LlmRewriteOutput | null> {
  const apiKey = getRewriteApiKey();
  if (!apiKey) {
    return null;
  }

  const historyText =
    history
      ?.slice(-4)
      .map((turn) => `${turn.role}: ${turn.content}`)
      .join('\n') || '';

  const systemPrompt = locale.startsWith('zh')
    ? [
        '你是一个梦境检索查询重写器。',
        '你的任务不是回答问题，而是把用户问题重写成更适合检索的结构化 JSON。',
        '只输出 JSON，不要输出解释。',
        '字段必须包含：normalizedQuery, dreamSymbols, emotions, sourceHints, expandedQueries, lexicalQueries, intentHint, confidence。',
        'intentHint 只能是 symbol_lookup, narrative_analysis, compare_sources, follow_up 之一。',
      ].join('\n')
    : [
        'You are a dream retrieval query rewriter.',
        'Do not answer the question. Rewrite it into retrieval-friendly JSON only.',
        'Output JSON with these fields: normalizedQuery, dreamSymbols, emotions, sourceHints, expandedQueries, lexicalQueries, intentHint, confidence.',
        'intentHint must be one of symbol_lookup, narrative_analysis, compare_sources, follow_up.',
      ].join('\n');

  const userPrompt = locale.startsWith('zh')
    ? [
        `用户问题：${query}`,
        historyText ? `对话历史：\n${historyText}` : '',
        '请输出 JSON。',
      ]
        .filter(Boolean)
        .join('\n\n')
    : [
        `User query: ${query}`,
        historyText ? `History:\n${historyText}` : '',
        'Return JSON only.',
      ]
        .filter(Boolean)
        .join('\n\n');

  const response = await fetch(getRewriteEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: CHAT_DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 500,
    }),
  });

  const payload = (await response.json()) as ChatResponse;

  if (!response.ok) {
    throw new Error(
      payload.error?.message ||
        payload.message ||
        `LLM rewrite failed with status ${response.status}`
    );
  }

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    return null;
  }

  const jsonText = extractJsonObject(content);
  if (!jsonText) {
    return null;
  }

  return JSON.parse(jsonText) as LlmRewriteOutput;
}
