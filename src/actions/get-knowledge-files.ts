'use server';

import { getDb } from '@/db';
import { knowledgeFiles } from '@/db/schema';
import { adminActionClient } from '@/lib/safe-action';
import { and, count, desc, eq, ilike, or } from 'drizzle-orm';
import { z } from 'zod';

const getKnowledgeFilesSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
});

export const getKnowledgeFilesAction = adminActionClient
  .inputSchema(getKnowledgeFilesSchema)
  .action(async ({ parsedInput }) => {
    const { page, pageSize, search, status } = parsedInput;

    try {
      const db = await getDb();

      // Build where conditions
      const whereConditions = [];

      // Add search filter
      if (search) {
        whereConditions.push(
          or(
            ilike(knowledgeFiles.fileName, `%${search}%`),
            ilike(knowledgeFiles.title, `%${search}%`),
            ilike(knowledgeFiles.author, `%${search}%`)
          )!
        );
      }

      // Add status filter
      if (status) {
        whereConditions.push(eq(knowledgeFiles.status, status));
      }

      const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Get total count
      const [{ total }] = await db
        .select({ total: count() })
        .from(knowledgeFiles)
        .where(whereClause);

      // Get paginated results
      const offset = (page - 1) * pageSize;
      const results = await db
        .select()
        .from(knowledgeFiles)
        .where(whereClause)
        .orderBy(desc(knowledgeFiles.createdAt))
        .limit(pageSize)
        .offset(offset);

      return {
        success: true,
        data: {
          files: results,
          total: Number(total),
          page,
          pageSize,
          totalPages: Math.ceil(Number(total) / pageSize),
        },
      };
    } catch (error) {
      console.error('get knowledge files error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get files',
      };
    }
  });
