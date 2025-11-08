-- Complete SQL to create demo-org client and fix user
-- Run this ENTIRE script in Supabase SQL Editor

-- Step 1: Check if clients table exists and what columns it has
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'clients'
ORDER BY ordinal_position;

-- Step 2: See existing clients (if any)
SELECT * FROM clients;

-- Step 3: Create demo-org client
-- Try this first (if clients table has id, name):
INSERT INTO clients (id, name)
VALUES ('demo-org', 'Demo Organization')
ON CONFLICT (id) DO NOTHING;

-- If that fails, try this (if it has more columns):
-- INSERT INTO clients (id, name, twilio_from, twilio_to)
-- VALUES ('demo-org', 'Demo Organization', NULL, NULL)
-- ON CONFLICT (id) DO NOTHING;

-- Step 4: Update demo user
UPDATE users
SET client_id = 'demo-org'
WHERE email = 'demo@leadlocker.app';

-- Step 5: Verify everything worked
SELECT 
    u.email,
    u.client_id,
    c.id as client_id_in_clients_table,
    c.name as client_name,
    CASE 
        WHEN u.client_id = c.id THEN '✅ SUCCESS - Everything matched!'
        WHEN c.id IS NULL THEN '❌ ERROR - Client not found in clients table'
        ELSE '❌ ERROR - Mismatch'
    END as status
FROM users u
LEFT JOIN clients c ON u.client_id = c.id
WHERE u.email = 'demo@leadlocker.app';


