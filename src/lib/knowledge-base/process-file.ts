import { getDb, withDbConnectionRetry } from '@/db';
import { knowledgeFiles } from '@/db/schema';
import { createHash } from 'crypto';
import { eq } from 'drizzle-orm';
import { cleanTextBySource } from './cleaners';
import { chunkByDreamProfile } from './dream-chunker';
import { embedBatch } from './embedder';
import { parseFile } from './parsers';
import {
  CHUNKER_VERSION,
  PARSER_VERSION,
  getSourceConfigForFile,
} from './source-manifest';
import { replaceDocumentsForFileWithMetadata } from './vector-store';

type Logger = Pick<typeof console, 'error' | 'log' | 'warn'>;

interface StartProcessingResult {
  alreadyProcessing: boolean;
  fileExists: boolean;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Processing failed';
}

function getEmbeddingDimension(): number {
  const parsed = Number.parseInt(process.env.EMBEDDING_DIMENSION || '4096', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 4096;
}

function checksumText(text: string): string {
  return createHash('sha256').update(text).digest('hex');
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

  const sourceConfig = getSourceConfigForFile(file.fileName, file.title);

  logger.log('🧹 清洗文本...');
  const cleanReport = cleanTextBySource(text, sourceConfig);
  logger.log('✅ 清洗完成:', {
    rawChars: cleanReport.rawChars,
    cleanChars: cleanReport.cleanChars,
    removedBlocks: cleanReport.removedBlocks,
    noiseRatio: cleanReport.noiseRatio,
    warnings: cleanReport.warnings,
  });

  logger.log('✂️ 按梦境资料 profile 分块...');
  const chunks = chunkByDreamProfile(
    cleanReport.cleanText,
    sourceConfig,
    cleanReport
  );
  logger.log('📐 分块 profile:', {
    parserProfile: sourceConfig.parserProfile,
    chunkProfile: sourceConfig.chunkProfile,
    sourceType: sourceConfig.sourceType,
  });
  logger.log(
    `✅ 分块完成,共 ${chunks.length} 块, active ${chunks.filter((chunk) => chunk.isActive).length} 块`
  );

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
  const chunkCount = await replaceDocumentsForFileWithMetadata(
    chunks,
    embeddings,
    file.id,
    file.fileName,
    sourceConfig.title || file.title || undefined,
    sourceConfig
  );
  logger.log('✅ 向量存储完成');

  await withDbConnectionRetry(async () => {
    const db = await getDb();
    await db
      .update(knowledgeFiles)
      .set({
        status: 'completed',
        chunkCount,
        sourceUrl: sourceConfig.sourceUrl || null,
        sourceType: sourceConfig.sourceType,
        language: sourceConfig.language,
        license: sourceConfig.license,
        copyrightStatus: sourceConfig.copyrightStatus,
        sourceWeight: sourceConfig.sourceWeight,
        isActive: true,
        checksum: checksumText(text),
        parserVersion: PARSER_VERSION,
        chunkerVersion: CHUNKER_VERSION,
        embeddingModel:
          process.env.EMBEDDING_MODEL || 'Qwen/Qwen3-Embedding-8B',
        embeddingDimension: getEmbeddingDimension(),
        metadata: {
          parserProfile: sourceConfig.parserProfile,
          chunkProfile: sourceConfig.chunkProfile,
          rawChars: cleanReport.rawChars,
          cleanChars: cleanReport.cleanChars,
          removedBlocks: cleanReport.removedBlocks,
          noiseRatio: cleanReport.noiseRatio,
          warnings: cleanReport.warnings,
        },
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
