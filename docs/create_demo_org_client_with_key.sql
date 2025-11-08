-- Create demo-org client with generated API key
-- api_key cannot be NULL, so we need to generate one

-- Step 1: Create demo-org client with a generated API key
INSERT INTO clients (id, name, api_key, twilio_from, twilio_to)
VALUES (
    'demo-org',
    'Demo Organization',
    'demo-org-' || substr(md5(random()::text || clock_timestamp()::text), 1, 32), -- Generate random API key
    NULL, -- Set Twilio number if you have one
    NULL  -- Set Twilio number if you have one
)
ON CONFLICT (id) DO UPDATE SET 
    name = 'Demo Organization',
    api_key = COALESCE(clients.api_key, 'demo-org-' || substr(md5(random()::text || clock_timestamp()::text), 1, 32));

-- Step 2: Update demo user to use demo-org
UPDATE users
SET client_id = 'demo-org'
WHERE email = 'demo@leadlocker.app';

-- Step 3: Verify everything worked
SELECT 
    u.email,
    u.name as user_name,
    u.client_id,
    c.id as client_id_in_table,
    c.name as client_name,
    c.api_key,
    CASE 
        WHEN u.client_id = c.id THEN '✅ SUCCESS - Demo user linked to demo-org'
        WHEN c.id IS NULL THEN '❌ ERROR - demo-org client not found'
        ELSE '❌ ERROR - Mismatch'
    END as status
FROM users u
LEFT JOIN clients c ON u.client_id = c.id
WHERE u.email = 'demo@leadlocker.app';

-- Step 4: Show all clients
SELECT id, name, LEFT(api_key, 20) || '...' as api_key_preview, created_at 
FROM clients 
ORDER BY created_at;


