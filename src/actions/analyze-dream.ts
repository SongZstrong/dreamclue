'use server';

import { analyzeDream } from '@/ai';
import { getDb } from '@/db';
import { dreams } from '@/db/schema';
import {
  getDreamAnalysisLimitStatus,
  hasUnlimitedProductAccess,
} from '@/lib/product-access';
import { userActionClient } from '@/lib/safe-action';
import { and, eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

const analyzeDreamSchema = z.object({
  id: z.string().min(1, 'Dream ID is required'),
  locale: z.string().optional().default('en'),
});

export const analyzeDreamAction = userActionClient
  .inputSchema(analyzeDreamSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { id, locale } = parsedInput;
    const currentUser = ctx.user;

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
        : await getDreamAnalysisLimitStatus(currentUser.id);

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

      // Call AI to analyze the dream
      const { analysis } = await analyzeDream({
        title: existingDream.title,
        content: existingDream.content,
        mood: existingDream.mood || undefined,
        tags: existingDream.tags || undefined,
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
                dailyCount: limitStatus.count + 1,
                dailyLimit: limitStatus.limit,
                remaining: Math.max(limitStatus.remaining - 1, 0),
              }
            : null,
        },
      };
    } catch (error) {
      console.error('analyze dream error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to analyze dream',
      };
    }
  });
