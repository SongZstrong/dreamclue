import type { RerankedSearchResult } from './reranker';

const BAILIAN_BASE_URL =
  process.env.BAILIAN_BASE_URL || 'https://dashscope.aliyuncs.com';
const SILICONFLOW_BASE_URL =
  process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn';
const CHAT_DEFAULT_MODEL = process.env.CHAT_DEFAULT_MODEL || 'qwen3-max';

export interface AnswerCitation {
  id: string;
  title: string;
  fileName: string;
  chunkId: number;
  excerpt: string;
}

export interface GeneratedKnowledgeAnswer {
  content: string;
  model: string;
  provider: 'bailian' | 'siliconflow';
  citations: AnswerCitation[];
}

interface ChatResponse {
  choices?: Array<{
    message?: {
      content?:
        | string
        | Array<{
            text?: string;
          }>;
    };
  }>;
  output?: {
    text?: string;
  };
  error?: {
    message?: string;
  };
  message?: string;
}

type ChatContent = string | Array<{ text?: string }> | undefined;

function truncateExcerpt(text: string, maxLength: number = 180): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength)}...`;
}

function getChatProvider(model: string): 'bailian' | 'siliconflow' {
  if (model.startsWith('Pro/') || model.toLowerCase().includes('glm')) {
    return 'siliconflow';
  }

  return 'bailian';
}

function getChatApiKey(provider: 'bailian' | 'siliconflow'): string | null {
  if (provider === 'bailian') {
    return process.env.BAILIAN_API_KEY || null;
  }

  return process.env.SILICONFLOW_API_KEY || null;
}

function getChatEndpoint(provider: 'bailian' | 'siliconflow'): string {
  if (provider === 'bailian') {
    const normalizedBaseUrl = BAILIAN_BASE_URL.replace(/\/+$/, '');
    return normalizedBaseUrl.endsWith('/compatible-mode/v1')
      ? `${normalizedBaseUrl}/chat/completions`
      : `${normalizedBaseUrl}/compatible-mode/v1/chat/completions`;
  }

  const normalizedBaseUrl = SILICONFLOW_BASE_URL.replace(/\/+$/, '');
  return normalizedBaseUrl.endsWith('/v1')
    ? `${normalizedBaseUrl}/chat/completions`
    : `${normalizedBaseUrl}/v1/chat/completions`;
}

function normalizeChatContent(content: ChatContent): string {
  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part: { text?: string }) => part.text || '')
      .join('')
      .trim();
  }

  return '';
}

function buildSystemPrompt(locale: string): string {
  if (locale.startsWith('zh')) {
    return [
      '你是一个梦境知识库助手。',
      '你的任务是基于给定文献片段回答用户问题，而不是凭空发挥。',
      '请给出克制、清晰、可读的解释，并在关键判断后用 [1]、[2] 这样的编号引用来源。',
      '如果文献之间存在差异，要明确指出差异，不要强行合并。',
      '不要把梦境解释成绝对事实，应以“可能”“倾向于”“文献中常见观点”为表达方式。',
    ].join('\n');
  }

  return [
    'You are a dream knowledge-base assistant.',
    'Answer strictly from the provided source passages instead of inventing unsupported claims.',
    'Write clearly, keep nuance, and cite important claims with [1], [2] style references.',
    'If sources disagree, explain the disagreement explicitly.',
    'Do not present dream interpretation as absolute fact; use cautious language such as "may", "can suggest", or "is commonly interpreted as".',
  ].join('\n');
}

function buildUserPrompt(
  query: string,
  locale: string,
  citations: AnswerCitation[]
): string {
  const context = citations
    .map(
      (citation, index) =>
        `[${index + 1}] ${citation.title} | ${citation.fileName} | chunk ${citation.chunkId}\n${citation.excerpt}`
    )
    .join('\n\n');

  if (locale.startsWith('zh')) {
    return [
      `用户问题：${query}`,
      '',
      '参考文献片段：',
      context,
      '',
      '请输出：',
      '1. 一个直接回答',
      '2. 两到三个关键解释点',
      '3. 如有必要，补充不同文献视角的差异',
      '4. 在引用依据时使用 [1]、[2] 这样的编号',
    ].join('\n');
  }

  return [
    `User question: ${query}`,
    '',
    'Reference passages:',
    context,
    '',
    'Please provide:',
    '1. A direct answer',
    '2. Two or three key interpretation points',
    '3. Differences across sources when relevant',
    '4. Citations using [1], [2] style references',
  ].join('\n');
}

export async function generateKnowledgeAnswer({
  query,
  results,
  locale,
  contextTopK,
}: {
  query: string;
  results: RerankedSearchResult[];
  locale: string;
  contextTopK: number;
}): Promise<GeneratedKnowledgeAnswer | null> {
  if (results.length === 0) {
    return null;
  }

  const model = CHAT_DEFAULT_MODEL;
  const provider = getChatProvider(model);
  const apiKey = getChatApiKey(provider);

  if (!apiKey) {
    return null;
  }

  const citations: AnswerCitation[] = results
    .slice(0, contextTopK)
    .map((result) => ({
      id: result.id,
      title: result.title,
      fileName: result.file_name,
      chunkId: result.chunk_id,
      excerpt: truncateExcerpt(result.text),
    }));

  const response = await fetch(getChatEndpoint(provider), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(locale),
        },
        {
          role: 'user',
          content: buildUserPrompt(query, locale, citations),
        },
      ],
      temperature: 0.5,
      max_tokens: 1200,
    }),
  });

  const payload = (await response.json()) as ChatResponse;

  if (!response.ok) {
    throw new Error(
      payload.error?.message ||
        payload.message ||
        `Chat generation failed with status ${response.status}`
    );
  }

  const content =
    normalizeChatContent(payload.choices?.[0]?.message?.content) ||
    payload.output?.text?.trim() ||
    '';

  if (!content) {
    throw new Error('Chat provider returned an empty answer');
  }

  return {
    content,
    model,
    provider,
    citations,
  };
}
