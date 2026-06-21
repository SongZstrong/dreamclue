import type { RerankedSearchResult } from './reranker';
import {
  type KnowledgeAnalysisSection,
  type PublicCitation,
  buildPublicCitations,
  getAnswerModelLabel,
  getKnowledgeDisclaimer,
  parseAnswerSections,
  selectAnswerContextResults,
} from './public-report';

const BAILIAN_BASE_URL =
  process.env.BAILIAN_BASE_URL || 'https://dashscope.aliyuncs.com';
const SILICONFLOW_BASE_URL =
  process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn';
const CHAT_DEFAULT_MODEL = process.env.CHAT_DEFAULT_MODEL || 'qwen3-max';

export interface GeneratedKnowledgeAnswer {
  content: string;
  model: string;
  modelLabel: string;
  provider: 'bailian' | 'siliconflow';
  sections: KnowledgeAnalysisSection[];
  citations: PublicCitation[];
  disclaimer: string;
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
      '铁律：如果检索结果中只有传统梦书/占梦资料，而没有 psychoanalytic、modern_sleep_science 或 curated_symbol 中的现代解释，请在“心理学/现代视角”部分明确说明：“当前知识库暂未收录该意象的现代心理学解释。”绝不允许自行编造心理学理论。',
    ].join('\n');
  }

  return [
    'You are a dream knowledge-base assistant.',
    'Answer strictly from the provided source passages instead of inventing unsupported claims.',
    'Write clearly, keep nuance, and cite important claims with [1], [2] style references.',
    'If sources disagree, explain the disagreement explicitly.',
    'Do not present dream interpretation as absolute fact; use cautious language such as "may", "can suggest", or "is commonly interpreted as".',
    'Hard rule: if the retrieved passages only contain traditional dream-book material and no psychoanalytic, modern_sleep_science, or curated_symbol modern interpretation, state in the psychology/modern section that the current knowledge base has not collected a modern psychological interpretation for this symbol. Never invent psychological theory.',
  ].join('\n');
}

function hasModernInterpretation(results: RerankedSearchResult[]): boolean {
  return results.some((result) =>
    ['psychoanalytic', 'modern_sleep_science', 'curated_symbol'].includes(
      result.source_type || ''
    )
  );
}

function buildUserPrompt(
  query: string,
  locale: string,
  citations: PublicCitation[],
  hasModernSources: boolean
): string {
  const context = citations
    .map((citation) =>
      [
        `[${citation.index}] ${citation.sourceTitle} · ${citation.entryTitle}`,
        locale.startsWith('zh')
          ? `来源类型：${citation.sourceTypeLabel}`
          : `Source type: ${citation.sourceTypeLabel}`,
        locale.startsWith('zh') ? '核心原文：' : 'Relevant passage:',
        citation.quote,
      ].join('\n')
    )
    .join('\n\n');

  if (locale.startsWith('zh')) {
    return [
      `用户问题：${query}`,
      '',
      '参考文献片段：',
      context,
      '',
      hasModernSources
        ? '现代资料状态：已检索到现代/心理学相关资料。'
        : '现代资料状态：未检索到 psychoanalytic、modern_sleep_science 或 curated_symbol 现代解释资料。',
      '',
      '请严格按以下结构输出，不要改标题：',
      '直接解释',
      '传统梦书视角',
      '心理学/现代视角',
      '可能关联的现实情绪',
      '不同来源的差异',
      '参考来源',
      '',
      '如果现代资料状态为未检索到现代解释资料，必须在“心理学/现代视角”部分写出：“当前知识库暂未收录该意象的现代心理学解释。”',
      '所有关键判断必须使用 [1]、[2] 这样的编号引用来源。',
    ].join('\n');
  }

  return [
    `User question: ${query}`,
    '',
    'Reference passages:',
    context,
    '',
    hasModernSources
      ? 'Modern source status: modern/psychological material was retrieved.'
      : 'Modern source status: no psychoanalytic, modern_sleep_science, or curated_symbol modern interpretation was retrieved.',
    '',
    'Use exactly these section headings:',
    'Direct Interpretation',
    'Traditional Dream-Book View',
    'Psychology / Modern View',
    'Possible Real-Life Emotions',
    'Differences Across Sources',
    'References',
    '',
    'If the modern source status says no modern interpretation was retrieved, explicitly say in the Psychology / Modern View section that the current knowledge base has not collected a modern psychological interpretation for this symbol.',
    'Use [1], [2] style citations for important claims.',
  ].join('\n');
}

export async function generateKnowledgeAnswer({
  query,
  results,
  locale,
  contextTopK,
  queryTerms = [],
}: {
  query: string;
  results: RerankedSearchResult[];
  locale: string;
  contextTopK: number;
  queryTerms?: string[];
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

  const contextResults = selectAnswerContextResults({
    results,
    queryTerms,
    limit: contextTopK,
  });
  const citations = buildPublicCitations(contextResults, locale, queryTerms);
  const hasModernSources = hasModernInterpretation(contextResults);

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
          content: buildUserPrompt(query, locale, citations, hasModernSources),
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
    modelLabel: getAnswerModelLabel(locale),
    provider,
    sections: parseAnswerSections(content, locale),
    citations,
    disclaimer: getKnowledgeDisclaimer(locale),
  };
}
