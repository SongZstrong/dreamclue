-- 创建管理员账号 (修正版 - 使用正确的字段名)

INSERT INTO "user" (
  id,
  email,
  name,
  role,
  email_verified,
  created_at,
  updated_at
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
  updated_at = NOW();

-- 查看结果
SELECT id, email, name, role, email_verified, created_at
FROM "user"
WHERE email = 'admin@dreambook.com';
