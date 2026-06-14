'use server';

import { getDb } from '@/db';
import { dreams } from '@/db/schema';
import { userActionClient } from '@/lib/safe-action';
import { and, eq, gte, lte } from 'drizzle-orm';
import { format, subDays } from 'date-fns';
import { z } from 'zod';

const getDreamTimelineSchema = z.object({
  range: z.enum(['7', '30', '90']).default('7'),
});

export const getDreamTimelineAction = userActionClient
  .inputSchema(getDreamTimelineSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { range } = parsedInput;
      const db = await getDb();
      const userId = ctx.user.id;
      const now = new Date();
      const days = Number.parseInt(range);
      const startDate = subDays(now, days - 1);

      // Get all dreams in the date range
      const allDreams = await db
        .select({
          id: dreams.id,
          createdAt: dreams.createdAt,
        })
        .from(dreams)
        .where(
          and(
            eq(dreams.userId, userId),
            gte(dreams.createdAt, startDate),
            lte(dreams.createdAt, now)
          )
        );

      // Count dreams by date
      const dateCounts = new Map<string, number>();

      // Initialize all dates with 0
      for (let i = 0; i < days; i++) {
        const date = subDays(now, days - 1 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        dateCounts.set(dateStr, 0);
      }

      // Count actual dreams
      allDreams.forEach((dream) => {
        const dateStr = format(dream.createdAt, 'yyyy-MM-dd');
        dateCounts.set(dateStr, (dateCounts.get(dateStr) || 0) + 1);
      });

      // Convert to array for chart
      const timeline = Array.from(dateCounts.entries())
        .map(([date, count]) => ({
          date,
          count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        success: true,
        data: {
          timeline,
          range: days,
        },
      };
    } catch (error) {
      console.error('get dream timeline error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get timeline',
      };
    }
  });
