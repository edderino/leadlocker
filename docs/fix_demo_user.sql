-- Fix Demo User: Link auth.users to public.users table
-- Run this in Supabase SQL Editor

-- Step 1: Check if the users table has auth_id and client_id columns
-- If not, add them:
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS client_id TEXT;

-- Step 2: Find the auth user for demo@leadlocker.app
SELECT 
    id as auth_user_id,
    email,
    created_at
FROM auth.users
WHERE email = 'demo@leadlocker.app';

-- Step 3: Insert or update the user record
-- REPLACE THE UUID BELOW with the auth_user_id from Step 2
INSERT INTO users (email, name, phone, auth_id, client_id)
VALUES (
    'demo@leadlocker.app',
    'Demo User',
    '+1234567890', -- Update with actual phone if needed
    'PASTE_AUTH_USER_ID_HERE'::uuid, -- Replace with actual UUID from Step 2
    'demo-org' -- or 'client_ed' if that's your client_id
)
ON CONFLICT (email) 
DO UPDATE SET
    auth_id = EXCLUDED.auth_id,
    client_id = EXCLUDED.client_id;

-- Step 4: Verify the fix
SELECT 
    u.id,
    u.email,
    u.name,
    u.auth_id,
    u.client_id,
    au.id as auth_users_id,
    au.email as auth_email,
    CASE 
        WHEN u.auth_id::uuid = au.id THEN '✅ MATCH'
        ELSE '❌ MISMATCH'
    END as match_status
FROM users u
LEFT JOIN auth.users au ON u.auth_id::uuid = au.id
WHERE u.email = 'demo@leadlocker.app';


