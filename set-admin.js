#!/usr/bin/env node

/**
 * 设置管理员账号
 *
 * 使用方法:
 * node set-admin.js <email>
 *
 * 例如:
 * node set-admin.js admin@example.com
 */

const { getDb } = require('./src/db');
const { user } = require('./src/db/schema');
const { eq } = require('drizzle-orm');

async function setAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ 错误: 请提供邮箱地址');
    console.log('');
    console.log('使用方法:');
    console.log('  node set-admin.js <email>');
    console.log('');
    console.log('例如:');
    console.log('  node set-admin.js admin@example.com');
    process.exit(1);
  }

  try {
    console.log('🔐 设置管理员权限...');
    console.log('');

    const db = await getDb();

    // 查找用户
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!existingUser) {
      console.error(`❌ 错误: 找不到邮箱为 ${email} 的用户`);
      console.log('');
      console.log('请先注册账号:');
      console.log('  1. 访问 http://localhost:3000/auth/sign-up');
      console.log('  2. 使用该邮箱注册');
      console.log('  3. 再次运行此脚本');
      process.exit(1);
    }

    // 更新为管理员
    await db
      .update(user)
      .set({
        role: 'admin',
        updatedAt: new Date(),
      })
      .where(eq(user.email, email));

    console.log('✅ 成功设置管理员权限!');
    console.log('');
    console.log('账号信息:');
    console.log(`  邮箱: ${email}`);
    console.log(`  角色: admin`);
    console.log('');
    console.log('现在可以访问:');
    console.log('  http://localhost:3000/admin/knowledge');
    console.log('');
  } catch (error) {
    console.error('❌ 操作失败:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

setAdmin();
