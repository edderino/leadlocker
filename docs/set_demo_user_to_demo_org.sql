-- Set demo user's client_id to 'demo-org' (NOT client_ed - that's for a different client)
-- Run this in Supabase SQL Editor

-- Update demo user
UPDATE users
SET client_id = 'demo-org'
WHERE email = 'demo@leadlocker.app';

-- Verify it worked
SELECT 
    email,
    name,
    client_id,
    CASE 
        WHEN client_id = 'demo-org' THEN '✅ CORRECT - Demo user is set to demo-org'
        ELSE '❌ WRONG - client_id is ' || client_id
    END as status
FROM users
WHERE email = 'demo@leadlocker.app';

-- Also show all users to confirm client_ed is for a different client
SELECT 
    email,
    name,
    client_id,
    CASE 
        WHEN email = 'demo@leadlocker.app' AND client_id = 'demo-org' THEN '✅ Demo user'
        WHEN client_id = 'client_ed' THEN '✅ Eddy client'
        ELSE 'Other'
    END as user_type
FROM users
ORDER BY email;


