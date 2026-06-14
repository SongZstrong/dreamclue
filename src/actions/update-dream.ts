'use server';

import { getDb } from '@/db';
import { dreams } from '@/db/schema';
import { userActionClient } from '@/lib/safe-action';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

const updateDreamSchema = z.object({
  id: z.string().min(1, 'Dream ID is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(5000, 'Content is too long'),
  mood: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateDreamAction = userActionClient
  .inputSchema(updateDreamSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { id, title, content, mood, tags } = parsedInput;
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

      // Update the dream
      const [updatedDream] = await db
        .update(dreams)
        .set({
          title,
          content,
          mood: mood || null,
          tags: tags || null,
          updatedAt: new Date(),
        })
        .where(eq(dreams.id, id))
        .returning();

      return {
        success: true,
        data: updatedDream,
      };
    } catch (error) {
      console.error('update dream error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update dream',
      };
    }
  });
