'use server';

import { getDb } from '@/db';
import { dreams } from '@/db/schema';
import { userActionClient } from '@/lib/safe-action';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

const getDreamSchema = z.object({
  id: z.string().min(1, 'Dream ID is required'),
});

export const getDreamAction = userActionClient
  .inputSchema(getDreamSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { id } = parsedInput;
    const currentUser = ctx.user;

    try {
      const db = await getDb();

      const [dream] = await db
        .select()
        .from(dreams)
        .where(and(eq(dreams.id, id), eq(dreams.userId, currentUser.id)))
        .limit(1);

      if (!dream) {
        return {
          success: false,
          error: 'Dream not found',
        };
      }

      return {
        success: true,
        data: dream,
      };
    } catch (error) {
      console.error('get dream error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get dream',
      };
    }
  });
