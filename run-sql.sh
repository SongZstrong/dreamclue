#!/bin/bash

# 从 .env.local 读取 DATABASE_URL
if [ -f .env.local ]; then
    export $(cat .env.local | grep DATABASE_URL | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ 错误: 找不到 DATABASE_URL"
    echo "请确保 .env.local 文件存在并包含 DATABASE_URL"
    exit 1
fi

echo "🔐 创建管理员账号..."
echo ""

# 执行 SQL
psql "$DATABASE_URL" << 'EOSQL'
INSERT INTO "user" (
  id, 
  email, 
  name, 
  role, 
  "emailVerified", 
  "createdAt", 
  "updatedAt"
)
VALUES (
  gen_random_uuid(),
  'admin@dreambook.com',
  'Admin',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
  role = 'admin', 
  "updatedAt" = NOW();

SELECT '✅ 管理员账号创建成功!' as status;
SELECT '' as blank;
SELECT '📧 登录信息:' as info;
SELECT email, name, role 
FROM "user" 
WHERE email = 'admin@dreambook.com';
EOSQL

echo ""
echo "📝 下一步:"
echo "  1. 访问 http://localhost:3000/auth/sign-in"
echo "  2. 点击 'Forgot password?'"
echo "  3. 输入邮箱: admin@dreambook.com"
echo "  4. 设置密码后登录"
echo "  5. 访问 http://localhost:3000/admin/knowledge"
echo ""
