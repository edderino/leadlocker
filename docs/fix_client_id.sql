-- FIX: Set client_id for demo user
-- Run this in Supabase SQL Editor

UPDATE users
SET client_id = 'demo-org'
WHERE email = 'demo@leadlocker.app';

-- Verify the fix
SELECT 
    id,
    email,
    name,
    auth_id,
    client_id,
    CASE 
        WHEN client_id IS NULL THEN '❌ STILL MISSING'
        WHEN client_id = '' THEN '❌ STILL EMPTY'
        ELSE '✅ FIXED: client_id = ' || client_id
    END as status
FROM users
WHERE email = 'demo@leadlocker.app';


