'use server';

import { getDb } from '@/db';
import { dreams } from '@/db/schema';
import { userActionClient } from '@/lib/safe-action';
import { and, count, desc, eq, ilike, or } from 'drizzle-orm';
import { z } from 'zod';

const getDreamsSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  mood: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const getDreamsAction = userActionClient
  .inputSchema(getDreamsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { page, pageSize, search, mood, sortBy, sortOrder } = parsedInput;
    const currentUser = ctx.user;

    try {
      const db = await getDb();

      // Build where conditions
      const whereConditions = [eq(dreams.userId, currentUser.id)];

      // Add search filter
      if (search) {
        whereConditions.push(
          or(
            ilike(dreams.title, `%${search}%`),
            ilike(dreams.content, `%${search}%`)
          )!
        );
      }

      // Add mood filter
      if (mood) {
        whereConditions.push(eq(dreams.mood, mood));
      }

      const whereClause = and(...whereConditions);

      // Get total count
      const [{ total }] = await db
        .select({ total: count() })
        .from(dreams)
        .where(whereClause);

      // Get paginated results
      const offset = (page - 1) * pageSize;
      const orderByClause =
        sortOrder === 'desc' ? desc(dreams[sortBy]) : dreams[sortBy];

      const results = await db
        .select()
        .from(dreams)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(pageSize)
        .offset(offset);

      return {
        success: true,
        data: {
          dreams: results,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (error) {
      console.error('get dreams error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get dreams',
      };
    }
  });
