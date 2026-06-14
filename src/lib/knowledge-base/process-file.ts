import { getDb, withDbConnectionRetry } from '@/db';
import { knowledgeFiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { chunkText, getChunkingConfig } from './chunker';
import { embedBatch } from './embedder';
import { parseFile } from './parsers';
import { replaceDocumentsForFile } from './vector-store';

type Logger = Pick<typeof console, 'error' | 'log' | 'warn'>;

interface StartProcessingResult {
  alreadyProcessing: boolean;
  fileExists: boolean;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Processing failed';
}

export async function startKnowledgeFileProcessing(
  fileId: string
): Promise<StartProcessingResult> {
  const [file] = await withDbConnectionRetry(async () => {
    const db = await getDb();
    return db
      .select({
        id: knowledgeFiles.id,
        status: knowledgeFiles.status,
      })
      .from(knowledgeFiles)
      .where(eq(knowledgeFiles.id, fileId))
      .limit(1);
  });

  if (!file) {
    return {
      alreadyProcessing: false,
      fileExists: false,
    };
  }

  if (file.status === 'processing') {
    return {
      alreadyProcessing: true,
      fileExists: true,
    };
  }

  await withDbConnectionRetry(async () => {
    const db = await getDb();
    await db
      .update(knowledgeFiles)
      .set({
        status: 'processing',
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(knowledgeFiles.id, fileId));
  });

  return {
    alreadyProcessing: false,
    fileExists: true,
  };
}

export async function processKnowledgeFile(
  fileId: string,
  logger: Logger = console
): Promise<{ chunkCount: number; fileId: string }> {
  const [file] = await withDbConnectionRetry(async () => {
    const db = await getDb();
    return db
      .select()
      .from(knowledgeFiles)
      .where(eq(knowledgeFiles.id, fileId))
      .limit(1);
  }, logger);

  if (!file) {
    throw new Error(`Knowledge file not found: ${fileId}`);
  }

  logger.log('📖 解析文件:', file.filePath);

  const text = await parseFile(file.filePath);
  logger.log(`✅ 解析完成,文本长度: ${text.length}`);

  logger.log('✂️ 分块文本...');
  const chunkingConfig = getChunkingConfig();
  const chunks = chunkText(
    text,
    chunkingConfig.chunkSize,
    chunkingConfig.overlap,
    chunkingConfig.minChunkSize
  );
  logger.log('📐 分块参数:', chunkingConfig);
  logger.log(`✅ 分块完成,共 ${chunks.length} 块`);

  if (chunks.length === 0) {
    throw new Error('No chunks created');
  }

  logger.log('🧠 生成向量嵌入...');
  const texts = chunks.map((chunk) => chunk.text);
  const embeddings = await embedBatch(texts, (current, total) => {
    logger.log(`   进度: ${current}/${total}`);
  });
  logger.log('✅ 向量生成完成');

  logger.log('💾 存储到向量数据库...');
  const chunkCount = await replaceDocumentsForFile(
    chunks,
    embeddings,
    file.id,
    file.fileName,
    file.title || undefined
  );
  logger.log('✅ 向量存储完成');

  await withDbConnectionRetry(async () => {
    const db = await getDb();
    await db
      .update(knowledgeFiles)
      .set({
        status: 'completed',
        chunkCount,
        processedAt: new Date(),
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(knowledgeFiles.id, fileId));
  }, logger);

  logger.log('✅ 文件处理完成:', fileId);

  return {
    fileId,
    chunkCount,
  };
}

export async function markKnowledgeFileProcessingFailed(
  fileId: string,
  error: unknown,
  logger: Logger = console
) {
  const [file] = await withDbConnectionRetry(async () => {
    const db = await getDb();
    return db
      .select({ id: knowledgeFiles.id })
      .from(knowledgeFiles)
      .where(eq(knowledgeFiles.id, fileId))
      .limit(1);
  }, logger);

  if (!file) {
    logger.warn(`⚠️ 知识库文件记录不存在，跳过失败状态更新: ${fileId}`);
    return;
  }

  await withDbConnectionRetry(async () => {
    const db = await getDb();
    await db
      .update(knowledgeFiles)
      .set({
        status: 'failed',
        errorMessage: getErrorMessage(error),
        updatedAt: new Date(),
      })
      .where(eq(knowledgeFiles.id, fileId));
  }, logger);
}

export async function processKnowledgeFileWithFailureHandling(
  fileId: string,
  logger: Logger = console
) {
  try {
    return await processKnowledgeFile(fileId, logger);
  } catch (error) {
    logger.error('❌ 处理失败:', error);
    await markKnowledgeFileProcessingFailed(fileId, error, logger);
    throw error;
  }
}
