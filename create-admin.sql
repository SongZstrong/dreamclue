-- 创建管理员账号 SQL 脚本
-- 使用方法: 在数据库客户端中执行此脚本

-- 方式1: 创建新管理员账号
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

-- 查看创建结果
SELECT id, email, name, role, "emailVerified", "createdAt"
FROM "user"
WHERE email = 'admin@dreambook.com';

-- 方式2: 将现有用户设置为管理员
-- UPDATE "user"
-- SET role = 'admin', "updatedAt" = NOW()
-- WHERE email = 'your-existing-email@example.com';

-- 查看所有管理员
SELECT id, email, name, role
FROM "user"
WHERE role = 'admin';
