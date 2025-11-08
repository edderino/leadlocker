-- QUICK FIX: Create demo user record
-- Run this AFTER you get the auth user ID from auth.users

-- First, get the auth user ID:
-- SELECT id, email FROM auth.users WHERE email = 'demo@leadlocker.app';

-- Then run this (replace YOUR_AUTH_USER_ID with the UUID from above):
INSERT INTO users (email, name, phone, auth_id, client_id)
VALUES (
    'demo@leadlocker.app',
    'Demo User',
    '+1234567890',
    'YOUR_AUTH_USER_ID'::uuid,  -- ← Replace this!
    'demo-org'  -- or 'client_ed' if that's your client_id
)
ON CONFLICT (email) 
DO UPDATE SET
    auth_id = EXCLUDED.auth_id,
    client_id = COALESCE(EXCLUDED.client_id, users.client_id);


