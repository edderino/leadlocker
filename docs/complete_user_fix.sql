-- COMPLETE FIX: Add missing columns and create demo user
-- Run this entire script in Supabase SQL Editor

-- Step 1: Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add auth_id column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'auth_id'
    ) THEN
        ALTER TABLE users ADD COLUMN auth_id UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added auth_id column';
    END IF;

    -- Add client_id column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'client_id'
    ) THEN
        ALTER TABLE users ADD COLUMN client_id TEXT;
        RAISE NOTICE 'Added client_id column';
    END IF;
END $$;

-- Step 2: Get the auth user ID for demo@leadlocker.app
DO $$
DECLARE
    auth_user_uuid UUID;
    existing_user_id UUID;
BEGIN
    -- Find the auth user
    SELECT id INTO auth_user_uuid
    FROM auth.users
    WHERE email = 'demo@leadlocker.app'
    LIMIT 1;

    IF auth_user_uuid IS NULL THEN
        RAISE EXCEPTION 'Auth user demo@leadlocker.app not found in auth.users. Create the user in Supabase Auth first.';
    END IF;

    RAISE NOTICE 'Found auth user ID: %', auth_user_uuid;

    -- Check if user already exists in users table
    SELECT id INTO existing_user_id
    FROM users
    WHERE email = 'demo@leadlocker.app'
    LIMIT 1;

    IF existing_user_id IS NOT NULL THEN
        -- Update existing user
        UPDATE users
        SET 
            auth_id = auth_user_uuid,
            client_id = COALESCE(client_id, 'demo-org')
        WHERE id = existing_user_id;
        RAISE NOTICE 'Updated existing user record';
    ELSE
        -- Insert new user
        INSERT INTO users (email, name, phone, auth_id, client_id)
        VALUES (
            'demo@leadlocker.app',
            'Demo User',
            '+1234567890',
            auth_user_uuid,
            'demo-org'
        );
        RAISE NOTICE 'Created new user record';
    END IF;
END $$;

-- Step 3: Verify the fix
SELECT 
    u.id,
    u.email,
    u.name,
    u.auth_id,
    u.client_id,
    au.id as auth_users_id,
    au.email as auth_email,
    CASE 
        WHEN u.auth_id::uuid = au.id THEN '✅ MATCH'
        ELSE '❌ MISMATCH'
    END as match_status
FROM users u
LEFT JOIN auth.users au ON u.auth_id::uuid = au.id
WHERE u.email = 'demo@leadlocker.app';


