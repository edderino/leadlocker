-- Step 1: Get the full UUID from auth.users for demo@leadlocker.app
SELECT 
    id as auth_user_id,
    email as auth_email,
    created_at as auth_created_at
FROM auth.users
WHERE email = 'demo@leadlocker.app';

-- Step 2: Check what's in the users table
SELECT 
    id,
    email,
    client_id,
    auth_id,
    LENGTH(auth_id::text) as auth_id_length
FROM users
WHERE email = 'demo@leadlocker.app';

-- Step 3: Update the auth_id to match (REPLACE THE UUID BELOW WITH THE ONE FROM STEP 1)
-- UPDATE users
-- SET auth_id = 'PASTE_THE_UUID_FROM_STEP_1_HERE'
-- WHERE email = 'demo@leadlocker.app';

-- Step 4: Verify the update worked
-- SELECT 
--     u.*,
--     au.email as auth_email,
--     CASE 
--         WHEN u.auth_id::uuid = au.id THEN '✅ MATCH'
--         ELSE '❌ MISMATCH'
--     END as match_status
-- FROM users u
-- LEFT JOIN auth.users au ON u.auth_id::uuid = au.id
-- WHERE u.email = 'demo@leadlocker.app';



