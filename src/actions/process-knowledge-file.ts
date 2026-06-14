'use server';

import { adminActionClient } from '@/lib/safe-action';
import {
  processKnowledgeFileWithFailureHandling,
  startKnowledgeFileProcessing,
} from '@/lib/knowledge-base/process-file';
import { z } from 'zod';

const processKnowledgeFileSchema = z.object({
  fileId: z.string().min(1),
});

export const processKnowledgeFileAction = adminActionClient
  .inputSchema(processKnowledgeFileSchema)
  .action(async ({ parsedInput }) => {
    const { fileId } = parsedInput;

    try {
      const startResult = await startKnowledgeFileProcessing(fileId);
      if (!startResult.fileExists) {
        return {
          success: false,
          error: 'File not found',
        };
      }

      if (startResult.alreadyProcessing) {
        return {
          success: true,
          data: {
            fileId,
            started: false,
          },
        };
      }

      const processed = await processKnowledgeFileWithFailureHandling(fileId, {
        log: (...args) => console.log(...args),
        warn: (...args) => console.warn(...args),
        error: (...args) => console.error(...args),
      });

      return {
        success: true,
        data: {
          fileId,
          chunkCount: processed.chunkCount,
          started: true,
        },
      };
    } catch (error) {
      console.error('process knowledge file error:', error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to process file',
      };
    }
  });
