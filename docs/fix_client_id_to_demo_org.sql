-- Fix: Update user's client_id to match the leads' org_id
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
        WHEN client_id = 'demo-org' THEN '✅ FIXED: client_id = demo-org'
        ELSE '❌ STILL WRONG: client_id = ' || client_id
    END as status
FROM users
WHERE email = 'demo@leadlocker.app';


