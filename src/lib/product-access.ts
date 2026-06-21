import { getDb, getSqlClient } from '@/db';
import { dreamAnalysisUsage, dreambookQueries, payment } from '@/db/schema';
import { PaymentScenes } from '@/payment/types';
import { and, eq, inArray, or, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type postgres from 'postgres';

export const FREE_AI_USAGE_LIMIT = Number.parseInt(
  process.env.FREE_AI_USAGE_LIMIT || '1',
  10
);

export interface AiUsageLimitStatus {
  allowed: boolean;
  count: number;
  limit: number;
  remaining: number;
  usageId?: string;
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
          )
        )
      )
    )
    .limit(1);

  return paidPlans.length > 0;
}

/**
 * Free users get one AI capability usage across the whole site.
 * Dreambook knowledge answers and dream journal AI analysis share this count.
 */
export async function getFreeAiUsageLimitStatus(
  userId: string
): Promise<AiUsageLimitStatus> {
  const db = await getDb();
  const [analysisResult, dreambookResult] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(dreamAnalysisUsage)
      .where(eq(dreamAnalysisUsage.userId, userId)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(dreambookQueries)
      .where(eq(dreambookQueries.userId, userId)),
  ]);

  const count =
    (analysisResult[0]?.count || 0) + (dreambookResult[0]?.count || 0);
  const remaining = Math.max(FREE_AI_USAGE_LIMIT - count, 0);

  return {
    allowed: count < FREE_AI_USAGE_LIMIT,
    count,
    limit: FREE_AI_USAGE_LIMIT,
    remaining,
  };
}

export const getDreamAnalysisLimitStatus = getFreeAiUsageLimitStatus;

export async function getDreambookQueryLimitStatus(
  userId: string
): Promise<AiUsageLimitStatus> {
  return getFreeAiUsageLimitStatus(userId);
}

async function reserveFreeAiUsage<T>(
  userId: string,
  insertUsage: (tx: postgres.TransactionSql, usageId: string) => Promise<T>
): Promise<AiUsageLimitStatus> {
  const sqlClient = getSqlClient();

  return sqlClient.begin(async (tx) => {
    await tx.unsafe('select pg_advisory_xact_lock(hashtext($1)::bigint)', [
      `free-ai-usage:${userId}`,
    ]);

    const countResult = await tx.unsafe<{ count: number }[]>(
      `
      select (
        (select count(*)::int from dream_analysis_usage where user_id = $1) +
        (select count(*)::int from dreambook_queries where user_id = $1)
      )::int as count
      `,
      [userId]
    );
    const count = Number(countResult[0]?.count || 0);

    if (count >= FREE_AI_USAGE_LIMIT) {
      return {
        allowed: false,
        count,
        limit: FREE_AI_USAGE_LIMIT,
        remaining: 0,
      };
    }

    const usageId = randomUUID();
    await insertUsage(tx, usageId);

    const nextCount = count + 1;
    return {
      allowed: true,
      count: nextCount,
      limit: FREE_AI_USAGE_LIMIT,
      remaining: Math.max(FREE_AI_USAGE_LIMIT - nextCount, 0),
      usageId,
    };
  });
}

export async function reserveFreeDreambookQueryUsage({
  userId,
  query,
}: {
  userId: string;
  query: string;
}): Promise<AiUsageLimitStatus> {
  return reserveFreeAiUsage(userId, async (tx, usageId) => {
    await tx.unsafe(
      `
      insert into dreambook_queries (id, user_id, query, result_count)
      values ($1, $2, $3, 0)
    `,
      [usageId, userId, query]
    );
  });
}

export async function updateDreambookQueryUsageResult(
  usageId: string,
  resultCount: number
): Promise<void> {
  const sqlClient = getSqlClient();
  await sqlClient`
    update dreambook_queries
    set result_count = ${resultCount}
    where id = ${usageId}
  `;
}

export async function releaseDreambookQueryUsage(
  usageId: string
): Promise<void> {
  const sqlClient = getSqlClient();
  await sqlClient`delete from dreambook_queries where id = ${usageId}`;
}

export async function reserveFreeDreamAnalysisUsage({
  userId,
  dreamId,
}: {
  userId: string;
  dreamId: string;
}): Promise<AiUsageLimitStatus> {
  return reserveFreeAiUsage(userId, async (tx, usageId) => {
    await tx.unsafe(
      `
      insert into dream_analysis_usage (id, user_id, dream_id)
      values ($1, $2, $3)
    `,
      [usageId, userId, dreamId]
    );
  });
}

export async function releaseDreamAnalysisUsage(
  usageId: string
): Promise<void> {
  const sqlClient = getSqlClient();
  await sqlClient`delete from dream_analysis_usage where id = ${usageId}`;
}
