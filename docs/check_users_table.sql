-- Check if users table exists and see its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- If table exists, show sample data
SELECT * FROM users LIMIT 5;

-- Check if demo user exists
SELECT 
    u.*,
    au.email as auth_email
FROM users u
LEFT JOIN auth.users au ON u.auth_id::uuid = au.id
WHERE au.email = 'demo@leadlocker.app';

