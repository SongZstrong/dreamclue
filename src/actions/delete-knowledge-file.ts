'use server';

import { getDb } from '@/db';
import { knowledgeFiles } from '@/db/schema';
import { adminActionClient } from '@/lib/safe-action';
import { deleteByFileId } from '@/lib/knowledge-base/vector-store';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { unlink } from 'fs/promises';

const deleteKnowledgeFileSchema = z.object({
  fileId: z.string().min(1),
});

export const deleteKnowledgeFileAction = adminActionClient
  .inputSchema(deleteKnowledgeFileSchema)
  .action(async ({ parsedInput }) => {
    const { fileId } = parsedInput;

    try {
      const db = await getDb();

      // Get file record
      const [file] = await db
        .select()
        .from(knowledgeFiles)
        .where(eq(knowledgeFiles.id, fileId))
        .limit(1);

      if (!file) {
        return {
          success: false,
          error: 'File not found',
        };
      }

      // Delete from vector store (if processed)
      if (file.status === 'completed') {
        try {
          await deleteByFileId(fileId);
        } catch (error) {
          console.error('Failed to delete from retrieval store:', error);
          // Continue with deletion even if vector store deletion fails
        }
      }

      // Delete physical file
      try {
        await unlink(file.filePath);
      } catch (error) {
        console.error('Failed to delete physical file:', error);
        // Continue with database deletion
      }

      // Delete database record
      await db.delete(knowledgeFiles).where(eq(knowledgeFiles.id, fileId));

      return {
        success: true,
        data: { fileId },
      };
    } catch (error) {
      console.error('delete knowledge file error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete file',
      };
    }
  });
