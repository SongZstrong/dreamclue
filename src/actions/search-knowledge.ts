'use server';

import { actionClient } from '@/lib/safe-action';
import { generateKnowledgeAnswer } from '@/lib/knowledge-base/answer-generator';
import { embedText } from '@/lib/knowledge-base/embedder';
import { detectIntent } from '@/lib/knowledge-base/intent-router';
import { diversifyResultsByFile } from '@/lib/knowledge-base/merge-results';
import { understandQuery } from '@/lib/knowledge-base/query-understanding';
import { rewriteQuery } from '@/lib/knowledge-base/query-rewriter';
import { buildRetrievalPlan } from '@/lib/knowledge-base/retrieval-plan';
import {
  buildPublicKnowledgeResults,
  getKnowledgeDisclaimer,
} from '@/lib/knowledge-base/public-report';
import {
  getConfiguredRerankContextTopK,
  rerankSearchResults,
} from '@/lib/knowledge-base/reranker';
import { reciprocalRankFusion } from '@/lib/knowledge-base/rrf';
import { searchLexicalDocuments } from '@/lib/knowledge-base/lexical-store';
import {
  type SearchResult,
  searchDocuments,
  searchSymbolDocuments,
  searchTheoryDocuments,
} from '@/lib/knowledge-base/vector-store';
import { auth } from '@/lib/auth';
import {
  hasUnlimitedProductAccess,
  releaseDreambookQueryUsage,
  reserveFreeDreambookQueryUsage,
  updateDreambookQueryUsageResult,
} from '@/lib/product-access';
import { headers } from 'next/headers';
import { z } from 'zod';
import { getTranslations } from 'next-intl/server';

const historyTurnSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
  citedChunkIds: z.array(z.string()).optional(),
  citedTitles: z.array(z.string()).optional(),
});

const searchKnowledgeSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  topK: z.number().min(1).max(50).default(10),
  locale: z.string().optional().default('en'),
  history: z.array(historyTurnSchema).optional().default([]),
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

export const searchKnowledgeAction = actionClient
  .inputSchema(searchKnowledgeSchema)
  .action(async ({ parsedInput }) => {
    const { query, topK, locale, history } = parsedInput;
    let reservedDreambookUsageId: string | null = null;

    try {
      // Get translations
      const t = await getTranslations({ locale, namespace: 'DreambookPage' });

      // Get current user session
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session?.user) {
        return {
          success: false,
          error: t('signInRequired'),
          signInRequired: true,
        };
      }

      const userId = session.user.id;
      const userRole = session.user.role as string | undefined;

      // Check if user has unlimited access
      const unlimited = await hasUnlimitedProductAccess(userId, userRole);
      const limitStatus = unlimited
        ? null
        : await reserveFreeDreambookQueryUsage({ userId, query });
      reservedDreambookUsageId = limitStatus?.usageId ?? null;

      // If not unlimited, check the shared free AI usage limit.
      if (limitStatus && !limitStatus.allowed) {
        return {
          success: false,
          error: t('limitReached', { limit: limitStatus.limit }),
          limitReached: true,
          dailyCount: limitStatus.count,
          dailyLimit: limitStatus.limit,
          remaining: 0,
        };
      }

      // Step 1: Query understanding, rewrite query and detect intent
      const rewritten = await rewriteQuery({
        query,
        locale,
        history,
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

      console.log('Dreambook rewritten query:', {
        normalizedQuery: rewritten.normalizedQuery,
        dreamSymbols: rewritten.dreamSymbols,
        queryUnderstanding,
        emotions: rewritten.emotions,
        sourceHints: rewritten.sourceHints,
        intent: intent.primary,
      });

      // Step 2: Run retrieval channels in parallel
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

      // Step 3: RRF candidate fusion
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

      // Step 4: Rerank fused candidates
      console.log('Reranking retrieved passages...');
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

      // Step 5: Generate final answer from reranked passages
      let answer = null;
      let answerWarning: string | undefined;

      try {
        answer = await generateKnowledgeAnswer({
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
      } catch (generationError) {
        console.error('knowledge answer generation error:', generationError);
        answerWarning = t('answerUnavailable');
      }

      if (!answer && !answerWarning && results.length > 0) {
        answerWarning = t('answerUnavailable');
      }

      // Step 6: Complete the reserved usage record.
      if (reservedDreambookUsageId) {
        await updateDreambookQueryUsageResult(
          reservedDreambookUsageId,
          results.length
        );
      }

      const publicResults = buildPublicKnowledgeResults(
        results,
        locale,
        queryTerms
      );
      const publicAnswer = answer
        ? {
            content: answer.content,
            modelLabel: answer.modelLabel,
            sections: answer.sections,
            citations: answer.citations,
            disclaimer: answer.disclaimer,
          }
        : null;

      return {
        success: true,
        data: {
          results: publicResults,
          count: results.length,
          unlimited,
          usage: limitStatus
            ? {
                dailyCount: limitStatus.count,
                dailyLimit: limitStatus.limit,
                remaining: limitStatus.remaining,
              }
            : null,
          answer: publicAnswer,
          answerWarning,
          disclaimer: getKnowledgeDisclaimer(locale),
        },
      };
    } catch (error) {
      if (reservedDreambookUsageId) {
        await releaseDreambookQueryUsage(reservedDreambookUsageId).catch(
          (releaseError) => {
            console.error('release dreambook query usage error:', releaseError);
          }
        );
      }

      console.error('search knowledge error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search',
      };
    }
  });
