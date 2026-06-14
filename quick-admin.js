#!/usr/bin/env node

const { getDb } = require('./src/db');
const { user } = require('./src/db/schema');
const { eq } = require('drizzle-orm');
const { randomUUID } = require('crypto');

async function quickAdmin() {
  const email = 'admin@dreambook.com';
  const name = 'Admin';

  try {
    console.log('🔐 设置管理员账号...\n');
    const db = await getDb();

    // 检查是否已存在
    const [existing] = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existing) {
      // 更新为管理员
      await db
        .update(user)
        .set({ role: 'admin', updatedAt: new Date() })
        .where(eq(user.email, email));
      console.log('✅ 已将现有账号设置为管理员!');
    } else {
      // 创建新管理员
      await db.insert(user).values({
        id: randomUUID(),
        email: email,
        name: name,
        role: 'admin',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('✅ 管理员账号创建成功!');
    }

    console.log('\n登录信息:');
    console.log(`  邮箱: ${email}`);
    console.log('\n使用方法:');
    console.log('  1. 访问 http://localhost:3000/auth/sign-in');
    console.log('  2. 使用 GitHub 或 Google 登录');
    console.log('  3. 或点击 "Forgot password?" 设置密码');
    console.log('\n访问知识库:');
    console.log('  http://localhost:3000/admin/knowledge\n');
  } catch (error) {
    console.error('❌ 操作失败:', error.message);
    process.exit(1);
  }
  process.exit(0);
}

quickAdmin();
