-- Create demo-org client and update demo user
-- Based on clients table structure: id, name, api_key, twilio_from, twilio_to, created_at

-- Step 1: Create demo-org client
INSERT INTO clients (id, name, api_key, twilio_from, twilio_to)
VALUES (
    'demo-org',
    'Demo Organization',
    NULL, -- Or generate a key if needed
    NULL, -- Set Twilio number if you have one
    NULL  -- Set Twilio number if you have one
)
ON CONFLICT (id) DO UPDATE SET name = 'Demo Organization';

-- Step 2: Update demo user to use demo-org
UPDATE users
SET client_id = 'demo-org'
WHERE email = 'demo@leadlocker.app';

-- Step 3: Verify everything
SELECT 
    u.email,
    u.name as user_name,
    u.client_id,
    c.id as client_id_in_table,
    c.name as client_name,
    CASE 
        WHEN u.client_id = c.id THEN '✅ SUCCESS - Demo user linked to demo-org'
        WHEN c.id IS NULL THEN '❌ ERROR - demo-org client not found'
        ELSE '❌ ERROR - Mismatch'
    END as status
FROM users u
LEFT JOIN clients c ON u.client_id = c.id
WHERE u.email = 'demo@leadlocker.app';

-- Step 4: Show all clients for reference
SELECT id, name, created_at FROM clients ORDER BY created_at;


