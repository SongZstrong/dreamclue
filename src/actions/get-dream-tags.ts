'use server';

import { getDb } from '@/db';
import { dreams } from '@/db/schema';
import { userActionClient } from '@/lib/safe-action';
import { eq } from 'drizzle-orm';

export const getDreamTagsAction = userActionClient.action(async ({ ctx }) => {
  try {
    const db = await getDb();
    const userId = ctx.user.id;

    // Get all dreams with tags
    const allDreams = await db
      .select({
        id: dreams.id,
        tags: dreams.tags,
      })
      .from(dreams)
      .where(eq(dreams.userId, userId));

    // Count tag frequency
    const tagCounts = new Map<string, number>();

    allDreams.forEach((dream) => {
      if (dream.tags && Array.isArray(dream.tags)) {
        dream.tags.forEach((tag) => {
          if (tag?.trim()) {
            const normalizedTag = tag.trim().toLowerCase();
            tagCounts.set(
              normalizedTag,
              (tagCounts.get(normalizedTag) || 0) + 1
            );
          }
        });
      }
    });

    // Convert to array and sort by frequency
    const tags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({
        tag,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 tags

    return {
      success: true,
      data: {
        tags,
        total: tags.length,
      },
    };
  } catch (error) {
    console.error('get dream tags error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tags',
    };
  }
});
