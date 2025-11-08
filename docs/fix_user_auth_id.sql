-- First, get the full UUID from auth.users for demo@leadlocker.app
SELECT 
    id,
    email,
    created_at
FROM auth.users
WHERE email = 'demo@leadlocker.app';

-- Then check what's currently in the users table
SELECT 
    id,
    email,
    client_id,
    auth_id,
    LENGTH(auth_id) as auth_id_length
FROM users
WHERE email = 'demo@leadlocker.app';

-- Update the auth_id to match the full UUID from auth.users
-- (Replace the UUID below with the actual one from the first query)
-- UPDATE users
-- SET auth_id = 'REPLACE_WITH_FULL_UUID_FROM_AUTH_USERS'
-- WHERE email = 'demo@leadlocker.app';



