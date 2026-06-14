import { getDb } from '@/db';
import { apikey } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

/**
 * Test verify an API key
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key } = body as { key?: string };

    if (!key || typeof key !== 'string') {
      return NextResponse.json(
        {
          valid: false,
          error: { message: 'API key is required', code: 'MISSING_KEY' },
        },
        { status: 400 }
      );
    }

    // Verify API key manually
    const db = await getDb();
    const [apiKey] = await db
      .select()
      .from(apikey)
      .where(eq(apikey.key, key))
      .limit(1);

    if (!apiKey) {
      return NextResponse.json({
        valid: false,
        error: { message: 'Invalid API key', code: 'INVALID_KEY' },
      });
    }

    // Check if expired
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return NextResponse.json({
        valid: false,
        error: { message: 'API key expired', code: 'EXPIRED_KEY' },
      });
    }

    return NextResponse.json({
      valid: true,
      userId: apiKey.userId,
      name: apiKey.name,
    });
  } catch (error) {
    console.error('API key verification error:', error);
    return NextResponse.json(
      {
        valid: false,
        error: { message: 'Verification failed', code: 'VERIFICATION_ERROR' },
      },
      { status: 500 }
    );
  }
}
