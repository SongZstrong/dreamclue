import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/epub+zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.txt',
  '.md',
  '.markdown',
  '.epub',
  '.docx',
];

export async function POST(request: Request) {
  try {
    // Verify session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const author = formData.get('author') as string;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 413 }
      );
    }

    // Validate file type
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          error: `File type not supported. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Generate unique file ID and path
    const fileId = randomUUID();
    const fileName = `${fileId}${ext}`;
    const uploadDir = path.join(process.cwd(), 'uploads', 'knowledge');
    const filePath = path.join(uploadDir, fileName);

    // Ensure upload directory exists
    await mkdir(uploadDir, { recursive: true });

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return file info
    return NextResponse.json({
      success: true,
      data: {
        fileId,
        fileName: file.name,
        fileType: ext.substring(1),
        fileSize: file.size,
        filePath,
        title: title || file.name,
        author: author || null,
        description: description || null,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
