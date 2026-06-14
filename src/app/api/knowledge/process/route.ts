import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import {
  processKnowledgeFileWithFailureHandling,
  startKnowledgeFileProcessing,
} from '@/lib/knowledge-base/process-file';

export async function POST(request: Request) {
  try {
    console.log('⚙️ 收到文件处理请求');

    // 1. 验证用户
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. 获取文件ID
    const { fileId } = await request.json();
    console.log('📄 处理文件ID:', fileId);

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'Missing fileId' },
        { status: 400 }
      );
    }

    const startResult = await startKnowledgeFileProcessing(fileId);

    if (!startResult.fileExists) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    if (startResult.alreadyProcessing) {
      return NextResponse.json({
        success: true,
        data: {
          fileId,
          started: false,
        },
        message: 'File is already processing',
      });
    }

    // 5. 异步处理文件(不阻塞响应)
    processKnowledgeFileWithFailureHandling(fileId).catch((error) => {
      console.error('❌ 异步处理失败:', error);
    });

    return NextResponse.json({
      success: true,
      data: {
        fileId,
        started: true,
      },
      message: 'Processing started',
    });
  } catch (error) {
    console.error('❌ 处理请求失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process',
      },
      { status: 500 }
    );
  }
}
