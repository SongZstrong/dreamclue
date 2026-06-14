'use server';

import { getDb } from '@/db';
import { knowledgeFiles } from '@/db/schema';
import { adminActionClient } from '@/lib/safe-action';
import { z } from 'zod';

const uploadKnowledgeFileSchema = z.object({
  fileId: z.string().min(1),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().min(1),
  filePath: z.string().min(1),
  title: z.string().optional(),
  author: z.string().optional(),
  description: z.string().optional(),
});

export const uploadKnowledgeFileAction = adminActionClient
  .inputSchema(uploadKnowledgeFileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const db = await getDb();
    const userId = ctx.user.id;

    // Create database record
    const [newFile] = await db
      .insert(knowledgeFiles)
      .values({
        id: parsedInput.fileId,
        userId,
        fileName: parsedInput.fileName,
        fileType: parsedInput.fileType,
        fileSize: parsedInput.fileSize,
        filePath: parsedInput.filePath,
        title: parsedInput.title || parsedInput.fileName,
        author: parsedInput.author || null,
        description: parsedInput.description || null,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return {
      success: true,
      data: newFile,
    };
  });
