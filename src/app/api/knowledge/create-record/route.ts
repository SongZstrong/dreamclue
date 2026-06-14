import { auth } from '@/lib/auth';
import { getDb } from '@/db';
import { knowledgeFiles } from '@/db/schema';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('📥 收到创建数据库记录请求');

    // 1. 验证用户
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      console.error('❌ 未登录');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. 验证管理员权限
    if (session.user.role !== 'admin') {
      console.error('❌ 非管理员');
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // 3. 解析请求数据
    const data = await request.json();
    console.log('📦 接收到的数据:', data);

    const {
      fileId,
      fileName,
      fileType,
      fileSize,
      filePath,
      title,
      author,
      description,
    } = data;

    if (!fileId || !fileName || !fileType || !fileSize || !filePath) {
      console.error('❌ 缺少必要字段');
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 4. 创建数据库记录
    console.log('💾 插入数据库...');
    const db = await getDb();

    const [newFile] = await db
      .insert(knowledgeFiles)
      .values({
        id: fileId,
        userId: session.user.id,
        fileName,
        fileType,
        fileSize,
        filePath,
        title: title || fileName,
        author: author || null,
        description: description || null,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log('✅ 数据库记录创建成功:', newFile.id);

    return NextResponse.json({
      success: true,
      data: newFile,
    });
  } catch (error) {
    console.error('❌ 创建数据库记录失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create record',
      },
      { status: 500 }
    );
  }
}
