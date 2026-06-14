'use server';

import { getDb } from '@/db';
import { dreams } from '@/db/schema';
import { userActionClient } from '@/lib/safe-action';
import { and, count, eq, gte, isNotNull, lte } from 'drizzle-orm';
import { startOfMonth, startOfWeek, subMonths } from 'date-fns';

export const getDreamStatsAction = userActionClient.action(async ({ ctx }) => {
  try {
    const db = await getDb();
    const userId = ctx.user.id;
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const monthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = monthStart;

    // Parallel queries for better performance
    const [
      totalResult,
      weekResult,
      monthResult,
      lastMonthResult,
      analyzedResult,
    ] = await Promise.all([
      // Total dreams
      db
        .select({ count: count() })
        .from(dreams)
        .where(eq(dreams.userId, userId)),

      // This week
      db
        .select({ count: count() })
        .from(dreams)
        .where(
          and(
            eq(dreams.userId, userId),
            gte(dreams.createdAt, weekStart),
            lte(dreams.createdAt, now)
          )
        ),

      // This month
      db
        .select({ count: count() })
        .from(dreams)
        .where(
          and(
            eq(dreams.userId, userId),
            gte(dreams.createdAt, monthStart),
            lte(dreams.createdAt, now)
          )
        ),

      // Last month
      db
        .select({ count: count() })
        .from(dreams)
        .where(
          and(
            eq(dreams.userId, userId),
            gte(dreams.createdAt, lastMonthStart),
            lte(dreams.createdAt, lastMonthEnd)
          )
        ),

      // Analyzed dreams
      db
        .select({ count: count() })
        .from(dreams)
        .where(and(eq(dreams.userId, userId), isNotNull(dreams.aiAnalysis))),
    ]);

    const total = Number(totalResult[0]?.count || 0);
    const thisWeek = Number(weekResult[0]?.count || 0);
    const thisMonth = Number(monthResult[0]?.count || 0);
    const lastMonth = Number(lastMonthResult[0]?.count || 0);
    const analyzed = Number(analyzedResult[0]?.count || 0);

    // Calculate analysis rate
    const analysisRate = total > 0 ? Math.round((analyzed / total) * 100) : 0;

    // Calculate month-over-month change
    const monthChange =
      lastMonth > 0
        ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
        : thisMonth > 0
          ? 100
          : 0;

    return {
      success: true,
      data: {
        total,
        thisWeek,
        thisMonth,
        lastMonth,
        analyzed,
        analysisRate,
        monthChange,
      },
    };
  } catch (error) {
    console.error('get dream stats error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats',
    };
  }
});
