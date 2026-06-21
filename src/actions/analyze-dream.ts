'use server';

import { getDb } from '@/db';
import { dreams } from '@/db/schema';
import { generateKnowledgeAnswer } from '@/lib/knowledge-base/answer-generator';
import { embedText } from '@/lib/knowledge-base/embedder';
import { detectIntent } from '@/lib/knowledge-base/intent-router';
import { searchLexicalDocuments } from '@/lib/knowledge-base/lexical-store';
import { diversifyResultsByFile } from '@/lib/knowledge-base/merge-results';
import { understandQuery } from '@/lib/knowledge-base/query-understanding';
import { rewriteQuery } from '@/lib/knowledge-base/query-rewriter';
import { buildRetrievalPlan } from '@/lib/knowledge-base/retrieval-plan';
import {
  getConfiguredRerankContextTopK,
  rerankSearchResults,
} from '@/lib/knowledge-base/reranker';
import { reciprocalRankFusion } from '@/lib/knowledge-base/rrf';
import {
  type SearchResult,
  searchDocuments,
  searchSymbolDocuments,
  searchTheoryDocuments,
} from '@/lib/knowledge-base/vector-store';
import {
  hasUnlimitedProductAccess,
  releaseDreamAnalysisUsage,
  reserveFreeDreamAnalysisUsage,
} from '@/lib/product-access';
import { userActionClient } from '@/lib/safe-action';
import { and, eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

const analyzeDreamSchema = z.object({
  id: z.string().min(1, 'Dream ID is required'),
  locale: z.string().optional().default('en'),
});

function dedupeStrings(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean))
  );
}

function buildQueryTerms({
  rewritten,
  queryUnderstanding,
}: {
  rewritten: {
    dreamSymbols: string[];
    emotions: string[];
  };
  queryUnderstanding: {
    normalizedSymbols: string[];
    symbolSearchTerms: string[];
    emotions: string[];
    scenes: string[];
  };
}): string[] {
  return dedupeStrings([
    ...rewritten.dreamSymbols,
    ...rewritten.emotions,
    ...queryUnderstanding.normalizedSymbols,
    ...queryUnderstanding.symbolSearchTerms,
    ...queryUnderstanding.emotions,
    ...queryUnderstanding.scenes,
  ]);
}

function buildDreamRetrievalQuery({
  title,
  content,
  mood,
  tags,
  locale,
}: {
  title: string;
  content: string;
  mood?: string | null;
  tags?: string[] | null;
  locale: string;
}) {
  if (locale.startsWith('zh')) {
    return [
      `标题：${title}`,
      `梦境内容：${content}`,
      mood ? `情绪：${mood}` : '',
      tags?.length ? `标签：${tags.join('、')}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  return [
    `Title: ${title}`,
    `Dream content: ${content}`,
    mood ? `Mood: ${mood}` : '',
    tags?.length ? `Tags: ${tags.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

async function analyzeDreamWithKnowledgeBase({
  title,
  content,
  mood,
  tags,
  locale,
}: {
  title: string;
  content: string;
  mood?: string | null;
  tags?: string[] | null;
  locale: string;
}) {
  const query = buildDreamRetrievalQuery({
    title,
    content,
    mood,
    tags,
    locale,
  });
  const topK = 10;

  const rewritten = await rewriteQuery({
    query,
    locale,
    history: [],
  });
  const queryUnderstanding = understandQuery({
    query,
    rewritten,
  });
  const enhancedRewritten = {
    ...rewritten,
    dreamSymbols: dedupeStrings([
      ...rewritten.dreamSymbols,
      ...queryUnderstanding.normalizedSymbols,
    ]),
    emotions: dedupeStrings([
      ...rewritten.emotions,
      ...queryUnderstanding.emotions,
    ]),
    lexicalQueries: dedupeStrings([
      ...rewritten.lexicalQueries,
      ...queryUnderstanding.symbolSearchTerms,
      ...queryUnderstanding.emotions,
      ...queryUnderstanding.scenes,
    ]),
    expandedQueries: dedupeStrings([
      ...rewritten.expandedQueries,
      ...queryUnderstanding.symbolSearchTerms,
    ]),
  };
  const intent = detectIntent(enhancedRewritten);
  const retrievalPlan = buildRetrievalPlan(enhancedRewritten, intent, topK);
  const queryTerms = buildQueryTerms({
    rewritten: enhancedRewritten,
    queryUnderstanding,
  });

  const symbolResultsPromise =
    queryUnderstanding.symbolSearchTerms.length > 0
      ? searchSymbolDocuments(
          queryUnderstanding.symbolSearchTerms,
          Math.min(topK * 3, 24)
        )
      : Promise.resolve([]);

  const vectorResultsPromise = retrievalPlan.vector.enabled
    ? embedText(retrievalPlan.vector.query).then((queryVector) =>
        searchDocuments(queryVector, retrievalPlan.vector.candidateTopK)
      )
    : Promise.resolve([] as SearchResult[]);

  const lexicalResultsPromise = retrievalPlan.lexical.enabled
    ? searchLexicalDocuments(
        dedupeStrings([
          ...retrievalPlan.lexical.queries,
          ...queryUnderstanding.symbolSearchTerms,
          ...queryUnderstanding.emotions,
        ]),
        retrievalPlan.lexical.topK
      )
    : Promise.resolve([]);

  const theoryResultsPromise = searchTheoryDocuments(
    dedupeStrings([
      query,
      rewritten.normalizedQuery,
      ...queryUnderstanding.normalizedSymbols,
      ...queryUnderstanding.emotions,
      ...queryUnderstanding.scenes,
    ]),
    Math.min(topK * 2, 12)
  );
  const [symbolResults, vectorResults, lexicalResults, theoryResults] =
    await Promise.all([
      symbolResultsPromise,
      vectorResultsPromise,
      lexicalResultsPromise,
      theoryResultsPromise,
    ]);

  const fusedResults = reciprocalRankFusion(
    [
      {
        channel: 'symbol',
        weight: intent.primary === 'symbol_lookup' ? 1.2 : 0.8,
        results: symbolResults,
      },
      {
        channel: 'lexical',
        weight: retrievalPlan.lexical.weight,
        results: lexicalResults,
      },
      {
        channel: 'vector',
        weight: retrievalPlan.vector.weight,
        results: vectorResults,
      },
      {
        channel: 'theory',
        weight:
          intent.primary === 'narrative_analysis' ||
          intent.primary === 'compare_sources'
            ? 0.65
            : 0.35,
        results: theoryResults,
      },
    ],
    {
      topK: Math.min(topK * 6, 50),
    }
  );

  const rerankedResults = retrievalPlan.rerank.enabled
    ? await rerankSearchResults(
        rewritten.normalizedQuery,
        fusedResults,
        retrievalPlan.rerank.topK
      )
    : fusedResults.slice(0, topK);

  const results = retrievalPlan.rerank.enforceSourceDiversity
    ? diversifyResultsByFile(rerankedResults, 2)
    : rerankedResults;

  const answer = await generateKnowledgeAnswer({
    query: rewritten.originalQuery,
    results,
    locale,
    contextTopK: Math.min(
      getConfiguredRerankContextTopK(),
      retrievalPlan.rerank.contextTopK,
      results.length
    ),
    queryTerms,
  });

  if (!answer) {
    throw new Error(
      locale.startsWith('zh')
        ? '知识库未返回可用的 AI 分析结果，请确认知识库已完成处理且聊天模型 API Key 已配置。'
        : 'The knowledge base did not return an AI analysis. Check that knowledge files are processed and the chat model API key is configured.'
    );
  }

  return {
    analysis: answer.content,
    resultCount: results.length,
  };
}

export const analyzeDreamAction = userActionClient
  .inputSchema(analyzeDreamSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { id, locale } = parsedInput;
    const currentUser = ctx.user;
    let reservedDreamAnalysisUsageId: string | null = null;

    try {
      const t = await getTranslations({ locale, namespace: 'Dreams' });
      const db = await getDb();

      // First check if dream exists and belongs to user
      const [existingDream] = await db
        .select()
        .from(dreams)
        .where(and(eq(dreams.id, id), eq(dreams.userId, currentUser.id)))
        .limit(1);

      if (!existingDream) {
        return {
          success: false,
          error: t('detail.notFound'),
        };
      }

      const unlimited = await hasUnlimitedProductAccess(
        currentUser.id,
        currentUser.role ?? undefined
      );
      const limitStatus = unlimited
        ? null
        : await reserveFreeDreamAnalysisUsage({
            userId: currentUser.id,
            dreamId: id,
          });
      reservedDreamAnalysisUsageId = limitStatus?.usageId ?? null;

      if (limitStatus && !limitStatus.allowed) {
        return {
          success: false,
          error: t('analysis.limitReached', { limit: limitStatus.limit }),
          limitReached: true,
          dailyCount: limitStatus.count,
          dailyLimit: limitStatus.limit,
          remaining: 0,
        };
      }

      // Generate the analysis through the knowledge-base retrieval pipeline.
      const { analysis } = await analyzeDreamWithKnowledgeBase({
        title: existingDream.title,
        content: existingDream.content,
        mood: existingDream.mood,
        tags: existingDream.tags,
        locale,
      });

      // Save the analysis to database
      const [updatedDream] = await db
        .update(dreams)
        .set({
          aiAnalysis: analysis,
          aiAnalyzedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(dreams.id, id))
        .returning();

      return {
        success: true,
        data: {
          analysis,
          dream: updatedDream,
          unlimited,
          usage: limitStatus
            ? {
                dailyCount: limitStatus.count,
                dailyLimit: limitStatus.limit,
                remaining: limitStatus.remaining,
              }
            : null,
        },
      };
    } catch (error) {
      if (reservedDreamAnalysisUsageId) {
        await releaseDreamAnalysisUsage(reservedDreamAnalysisUsageId).catch(
          (releaseError) => {
            console.error('release dream analysis usage error:', releaseError);
          }
        );
      }

      console.error('analyze dream error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to analyze dream',
      };
    }
  });
