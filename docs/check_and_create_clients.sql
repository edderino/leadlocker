-- Step 1: Check if clients table exists and see its structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'clients'
ORDER BY ordinal_position;

-- Step 2: See what clients exist
SELECT * FROM clients;

-- Step 3: Create demo-org client if it doesn't exist
INSERT INTO clients (id, name, twilio_from, twilio_to)
VALUES (
    'demo-org',
    'Demo Organization',
    NULL, -- Set these if you have Twilio numbers
    NULL
)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Update demo user to use demo-org
UPDATE users
SET client_id = 'demo-org'
WHERE email = 'demo@leadlocker.app';

-- Step 5: Verify everything
SELECT 
    u.email,
    u.client_id,
    c.id as client_exists,
    c.name as client_name,
    CASE 
        WHEN u.client_id = c.id THEN '✅ MATCHED'
        ELSE '❌ MISMATCH'
    END as status
FROM users u
LEFT JOIN clients c ON u.client_id = c.id
WHERE u.email = 'demo@leadlocker.app';


