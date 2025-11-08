-- FIX RLS: Clean up and create correct policy for users table
-- Run this in Supabase SQL Editor

-- Step 1: Drop existing conflicting policies
DROP POLICY IF EXISTS "Authenticated users can read own user record" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "users_self_select_only" ON users;

-- Step 2: Create correct policy that checks auth_id match
CREATE POLICY "Users can read own record by auth_id"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth_id::uuid = auth.uid()
  );

-- Step 3: Also create a policy for email fallback (needed for login)
-- This allows reading if the email matches the authenticated user's email
CREATE POLICY "Users can read own record by email"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE auth.users.id = auth.uid() 
        AND auth.users.email = users.email
    )
  );

-- Step 4: Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 5: Test the policy (optional - run as the authenticated user)
-- SELECT * FROM users WHERE email = 'demo@leadlocker.app';


