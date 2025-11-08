-- Fix: Create demo-org client and update user
-- Run this in Supabase SQL Editor

-- Step 1: Check clients table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'clients'
ORDER BY ordinal_position;

-- Step 2: See existing clients
SELECT * FROM clients;

-- Step 3: Create demo-org client (adjust columns based on your schema)
-- Common columns: id, name, twilio_from, twilio_to, created_at
INSERT INTO clients (id, name)
VALUES ('demo-org', 'Demo Organization')
ON CONFLICT (id) DO UPDATE SET name = 'Demo Organization';

-- If clients table has more columns, you might need:
-- INSERT INTO clients (id, name, twilio_from, twilio_to, created_at)
-- VALUES ('demo-org', 'Demo Organization', NULL, NULL, NOW())
-- ON CONFLICT (id) DO NOTHING;

-- Step 4: Now update the user (this should work now)
UPDATE users
SET client_id = 'demo-org'
WHERE email = 'demo@leadlocker.app';

-- Step 5: Verify
SELECT 
    u.email,
    u.client_id,
    c.id as client_exists,
    c.name as client_name,
    CASE 
        WHEN u.client_id = c.id THEN '✅ WORKING'
        ELSE '❌ STILL BROKEN'
    END as status
FROM users u
LEFT JOIN clients c ON u.client_id = c.id
WHERE u.email = 'demo@leadlocker.app';


