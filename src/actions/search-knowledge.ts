'use server';

import { actionClient } from '@/lib/safe-action';
import { generateKnowledgeAnswer } from '@/lib/knowledge-base/answer-generator';
import { embedText } from '@/lib/knowledge-base/embedder';
import { detectIntent } from '@/lib/knowledge-base/intent-router';
import {
  diversifyResultsByFile,
  mergeAndDedupeResults,
} from '@/lib/knowledge-base/merge-results';
import { rewriteQuery } from '@/lib/knowledge-base/query-rewriter';
import { buildRetrievalPlan } from '@/lib/knowledge-base/retrieval-plan';
import {
  getConfiguredRerankContextTopK,
  rerankSearchResults,
} from '@/lib/knowledge-base/reranker';
import { searchLexicalDocuments } from '@/lib/knowledge-base/lexical-store';
import {
  type SearchResult,
  searchDocuments,
} from '@/lib/knowledge-base/vector-store';
import { getDb } from '@/db';
import { dreambookQueries } from '@/db/schema';
import { auth } from '@/lib/auth';
import {
  getDreambookQueryLimitStatus,
  hasUnlimitedProductAccess,
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

/**
 * Record a dreambook query
 */
async function recordQuery(
  userId: string,
  query: string,
  resultCount: number
): Promise<void> {
  const db = await getDb();

  await db.insert(dreambookQueries).values({
    userId,
    query,
    resultCount,
  });
}

export const searchKnowledgeAction = actionClient
  .inputSchema(searchKnowledgeSchema)
  .action(async ({ parsedInput }) => {
    const { query, topK, locale, history } = parsedInput;

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
        : await getDreambookQueryLimitStatus(userId);

      // If not unlimited, check daily limit
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

      // Step 1: Rewrite query and detect intent
      const rewritten = await rewriteQuery({
        query,
        locale,
        history,
      });
      const intent = detectIntent(rewritten);
      const retrievalPlan = buildRetrievalPlan(rewritten, intent, topK);

      console.log('Dreambook rewritten query:', {
        normalizedQuery: rewritten.normalizedQuery,
        dreamSymbols: rewritten.dreamSymbols,
        emotions: rewritten.emotions,
        sourceHints: rewritten.sourceHints,
        intent: intent.primary,
      });

      // Step 2: Run retrieval channels
      let vectorResults: SearchResult[] = [];
      if (retrievalPlan.vector.enabled) {
        console.log('Generating query embedding...');
        const queryVector = await embedText(retrievalPlan.vector.query);

        console.log('Searching vector store...');
        vectorResults = await searchDocuments(
          queryVector,
          retrievalPlan.vector.candidateTopK
        );
      }

      const lexicalResults = retrievalPlan.lexical.enabled
        ? await searchLexicalDocuments(
            retrievalPlan.lexical.queries,
            retrievalPlan.lexical.topK
          )
        : [];

      // Step 3: Merge candidates
      const mergedResults = mergeAndDedupeResults(
        vectorResults,
        lexicalResults
      );

      // Step 4: Rerank merged candidates
      console.log('Reranking retrieved passages...');
      const rerankedResults = retrievalPlan.rerank.enabled
        ? await rerankSearchResults(
            rewritten.normalizedQuery,
            mergedResults,
            retrievalPlan.rerank.topK
          )
        : mergedResults.slice(0, topK);

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
        });
      } catch (generationError) {
        console.error('knowledge answer generation error:', generationError);
        answerWarning = t('answerUnavailable');
      }

      if (!answer && !answerWarning && results.length > 0) {
        answerWarning = t('answerUnavailable');
      }

      // Step 6: Record the query
      await recordQuery(userId, query, results.length);

      return {
        success: true,
        data: {
          results,
          count: results.length,
          unlimited,
          usage: limitStatus
            ? {
                dailyCount: limitStatus.count + 1,
                dailyLimit: limitStatus.limit,
                remaining: Math.max(limitStatus.remaining - 1, 0),
              }
            : null,
          answer,
          answerWarning,
          rewrite: rewritten,
          intent,
          retrievalPlan,
        },
      };
    } catch (error) {
      console.error('search knowledge error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search',
      };
    }
  });
