'use server';

import { getDb } from '@/db';
import { dreams } from '@/db/schema';
import { userActionClient } from '@/lib/safe-action';
import { z } from 'zod';

const createDreamSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(5000, 'Content is too long'),
  mood: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const createDreamAction = userActionClient
  .inputSchema(createDreamSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { title, content, mood, tags } = parsedInput;
    const currentUser = ctx.user;

    try {
      const db = await getDb();

      const [newDream] = await db
        .insert(dreams)
        .values({
          userId: currentUser.id,
          title,
          content,
          mood: mood || null,
          tags: tags || null,
        })
        .returning();

      return {
        success: true,
        data: newDream,
      };
    } catch (error) {
      console.error('create dream error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create dream',
      };
    }
  });
