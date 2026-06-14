import { getDb } from '@/db';
import { dreambookQueries, dreams, payment } from '@/db/schema';
import { PaymentScenes } from '@/payment/types';
import { and, eq, gte, inArray, or, sql } from 'drizzle-orm';

export const FREE_DAILY_DREAM_ANALYSIS_LIMIT = Number.parseInt(
  process.env.FREE_DAILY_DREAM_ANALYSIS_LIMIT || '3',
  10
);

export const FREE_DAILY_DREAMBOOK_QUERY_LIMIT = Number.parseInt(
  process.env.FREE_DAILY_DREAMBOOK_QUERY_LIMIT || '1',
  10
);

export interface DailyLimitStatus {
  allowed: boolean;
  count: number;
  limit: number;
  remaining: number;
}

function getTodayStart(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Paid subscription and lifetime users get unlimited product usage.
 * Credit package purchases should not unlock unlimited access.
 */
export async function hasUnlimitedProductAccess(
  userId: string,
  userRole?: string
): Promise<boolean> {
  if (userRole === 'admin') {
    return true;
  }

  const db = await getDb();
  const paidPlans = await db
    .select({ id: payment.id })
    .from(payment)
    .where(
      and(
        eq(payment.userId, userId),
        eq(payment.paid, true),
        or(
          and(
            eq(payment.scene, PaymentScenes.SUBSCRIPTION),
            inArray(payment.status, ['active', 'trialing'])
          ),
          and(
            eq(payment.scene, PaymentScenes.LIFETIME),
            inArray(payment.status, ['active', 'completed'])
          ),
          eq(payment.status, 'active')
        )
      )
    )
    .limit(1);

  return paidPlans.length > 0;
}

export async function getDreamAnalysisLimitStatus(
  userId: string
): Promise<DailyLimitStatus> {
  const db = await getDb();
  const today = getTodayStart();
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(dreams)
    .where(and(eq(dreams.userId, userId), gte(dreams.aiAnalyzedAt, today)));

  const count = result[0]?.count || 0;
  const remaining = Math.max(FREE_DAILY_DREAM_ANALYSIS_LIMIT - count, 0);

  return {
    allowed: count < FREE_DAILY_DREAM_ANALYSIS_LIMIT,
    count,
    limit: FREE_DAILY_DREAM_ANALYSIS_LIMIT,
    remaining,
  };
}

export async function getDreambookQueryLimitStatus(
  userId: string
): Promise<DailyLimitStatus> {
  const db = await getDb();
  const today = getTodayStart();
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(dreambookQueries)
    .where(
      and(
        eq(dreambookQueries.userId, userId),
        gte(dreambookQueries.createdAt, today)
      )
    );

  const count = result[0]?.count || 0;
  const remaining = Math.max(FREE_DAILY_DREAMBOOK_QUERY_LIMIT - count, 0);

  return {
    allowed: count < FREE_DAILY_DREAMBOOK_QUERY_LIMIT,
    count,
    limit: FREE_DAILY_DREAMBOOK_QUERY_LIMIT,
    remaining,
  };
}
