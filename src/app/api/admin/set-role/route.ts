import { type NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        { success: false, error: 'Email and role are required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 更新用户角色
    const [updatedUser] = await db
      .update(user)
      .set({ role, updatedAt: new Date() })
      .where(eq(user.email, email))
      .returning();

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Set role error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set role' },
      { status: 500 }
    );
  }
}
