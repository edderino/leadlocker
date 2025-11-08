-- Step 1: Check current client_id
SELECT 
    email,
    client_id,
    auth_id
FROM users
WHERE email = 'demo@leadlocker.app';

-- Step 2: Update to demo-org (run this)
UPDATE users
SET client_id = 'demo-org'
WHERE email = 'demo@leadlocker.app';

-- Step 3: Verify the update worked
SELECT 
    email,
    client_id,
    CASE 
        WHEN client_id = 'demo-org' THEN '✅ CORRECT'
        ELSE '❌ WRONG: ' || client_id
    END as status
FROM users
WHERE email = 'demo@leadlocker.app';

-- Step 4: Also check what org_id the leads are using
SELECT DISTINCT org_id, COUNT(*) as lead_count
FROM leads
GROUP BY org_id;


