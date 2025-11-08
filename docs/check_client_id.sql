-- Check client_id for demo user
SELECT 
    id,
    email,
    name,
    auth_id,
    client_id,
    CASE 
        WHEN client_id IS NULL THEN '❌ MISSING client_id'
        WHEN client_id = '' THEN '❌ EMPTY client_id'
        ELSE '✅ HAS client_id: ' || client_id
    END as client_id_status
FROM users
WHERE email = 'demo@leadlocker.app';


