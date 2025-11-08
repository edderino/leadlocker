-- DIAGNOSTIC: Check user setup
-- Run this in Supabase SQL Editor to see what's wrong

-- Step 1: Check if users table has the required columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Step 2: Check if demo user exists in auth.users
SELECT 
    id as auth_user_id,
    email as auth_email,
    created_at as auth_created_at
FROM auth.users
WHERE email = 'demo@leadlocker.app';

-- Step 3: Check if demo user exists in public.users table
SELECT 
    id,
    email,
    name,
    phone,
    auth_id,
    client_id,
    created_at
FROM users
WHERE email = 'demo@leadlocker.app';

-- Step 4: Check if they're linked (simpler approach)
SELECT 
    u.id as users_table_id,
    u.email as users_email,
    u.auth_id as users_auth_id,
    u.client_id as users_client_id,
    au.id as auth_users_id,
    au.email as auth_email,
    CASE 
        WHEN u.auth_id::uuid = au.id THEN '✅ LINKED'
        WHEN u.auth_id IS NULL THEN '❌ NO AUTH_ID'
        WHEN au.id IS NULL THEN '❌ AUTH USER NOT FOUND'
        ELSE '❌ MISMATCH'
    END as status
FROM users u
LEFT JOIN auth.users au ON u.auth_id::uuid = au.id
WHERE u.email = 'demo@leadlocker.app';

-- Step 5: Check auth.users side (if user doesn't exist in users table)
SELECT 
    au.id as auth_users_id,
    au.email as auth_email,
    u.id as users_table_id,
    u.auth_id as users_auth_id,
    CASE 
        WHEN u.id IS NULL THEN '❌ USER NOT IN users TABLE'
        WHEN u.auth_id::uuid = au.id THEN '✅ LINKED'
        ELSE '❌ MISMATCH'
    END as status
FROM auth.users au
LEFT JOIN users u ON u.email = au.email
WHERE au.email = 'demo@leadlocker.app';

