'use server';

import { getDb } from '@/db';
import { dreams } from '@/db/schema';
import { userActionClient } from '@/lib/safe-action';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

const deleteDreamSchema = z.object({
  id: z.string().min(1, 'Dream ID is required'),
});

export const deleteDreamAction = userActionClient
  .inputSchema(deleteDreamSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { id } = parsedInput;
    const currentUser = ctx.user;

    try {
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
          error: 'Dream not found',
        };
      }

      // Delete the dream
      await db.delete(dreams).where(eq(dreams.id, id));

      return {
        success: true,
        data: { id },
      };
    } catch (error) {
      console.error('delete dream error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete dream',
      };
    }
  });
