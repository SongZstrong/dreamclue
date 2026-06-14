'use server';

import { getDb } from '@/db';
import { dreams } from '@/db/schema';
import { userActionClient } from '@/lib/safe-action';
import { eq } from 'drizzle-orm';

export const getDreamMoodDistributionAction = userActionClient.action(
  async ({ ctx }) => {
    try {
      const db = await getDb();
      const userId = ctx.user.id;

      // Get all dreams with their moods
      const allDreams = await db
        .select({
          id: dreams.id,
          mood: dreams.mood,
        })
        .from(dreams)
        .where(eq(dreams.userId, userId));

      // Count moods in application layer
      const moodCounts = new Map<string, number>();
      let total = 0;

      allDreams.forEach((dream) => {
        const mood = dream.mood || 'unspecified';
        moodCounts.set(mood, (moodCounts.get(mood) || 0) + 1);
        total++;
      });

      // Convert to array and calculate percentages
      const distribution = Array.from(moodCounts.entries())
        .map(([mood, count]) => ({
          mood,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);

      return {
        success: true,
        data: {
          distribution,
          total,
        },
      };
    } catch (error) {
      console.error('get dream mood distribution error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get mood distribution',
      };
    }
  }
);
