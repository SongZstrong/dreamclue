#!/bin/bash

# 创建管理员账号脚本

echo "🔐 创建管理员账号"
echo "=================="
echo ""

# 检查是否有 DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 错误: DATABASE_URL 未设置"
    echo ""
    echo "请在 .env.local 中设置 DATABASE_URL"
    exit 1
fi

echo "请输入管理员信息:"
echo ""
read -p "邮箱: " EMAIL
read -sp "密码: " PASSWORD
echo ""
read -p "用户名: " NAME

echo ""
echo "正在创建管理员账号..."

# 使用 Node.js 脚本创建管理员
node -e "
const { getDb } = require('./src/db');
const { user } = require('./src/db/schema');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    const db = await getDb();
    const hashedPassword = await bcrypt.hash('$PASSWORD', 10);

    const [newUser] = await db.insert(user).values({
      email: '$EMAIL',
      name: '$NAME',
      role: 'admin',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    console.log('✅ 管理员账号创建成功!');
    console.log('');
    console.log('登录信息:');
    console.log('  邮箱:', '$EMAIL');
    console.log('  密码:', '$PASSWORD');
    console.log('');
    console.log('访问: http://localhost:3000/auth/sign-in');
  } catch (error) {
    console.error('❌ 创建失败:', error.message);
    process.exit(1);
  }
}

createAdmin();
"

echo ""
echo "✨ 完成!"
