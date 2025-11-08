-- FIX: Add RLS policy so authenticated users can read their own user record
-- Run this in Supabase SQL Editor

-- Policy: Authenticated users can SELECT their own user record
-- This allows reading by auth_id match OR email match (for login fallback)
CREATE POLICY "Authenticated users can read own user record"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth_id = auth.uid()
    OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1)
  );

-- Verify the policies were created
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

