-- Phase 6 Step 2: Push Notifications
-- Database Migration: Push Subscriptions Table

-- =====================================================
-- 1. Create push_subscriptions table
-- =====================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 2. Create index for efficient org_id queries
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_org_id 
ON push_subscriptions(org_id);

-- =====================================================
-- 3. Create index for endpoint lookups
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint 
ON push_subscriptions(endpoint);

-- =====================================================
-- 4. Add Row-Level Security (RLS) policies
-- =====================================================

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do anything (for backend operations)
CREATE POLICY "Service role has full access to push_subscriptions"
ON push_subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Org isolation for authenticated users (future enhancement)
CREATE POLICY "Users can manage own org subscriptions"
ON push_subscriptions
FOR ALL
TO authenticated
USING (org_id = current_setting('app.current_org_id', true))
WITH CHECK (org_id = current_setting('app.current_org_id', true));

-- =====================================================
-- 5. Create function to update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. Create trigger for automatic timestamp updates
-- =====================================================

DROP TRIGGER IF EXISTS push_subscriptions_updated_at ON push_subscriptions;

CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify table exists
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'push_subscriptions';

-- Verify columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'push_subscriptions'
ORDER BY ordinal_position;

-- Verify indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'push_subscriptions';

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'push_subscriptions';

-- Verify policies
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'push_subscriptions';

-- =====================================================
-- ROLLBACK SCRIPT (if needed)
-- =====================================================

/*
-- Uncomment to rollback

DROP TRIGGER IF EXISTS push_subscriptions_updated_at ON push_subscriptions;
DROP FUNCTION IF EXISTS update_push_subscriptions_updated_at();
DROP POLICY IF EXISTS "Users can manage own org subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Service role has full access to push_subscriptions" ON push_subscriptions;
DROP INDEX IF EXISTS idx_push_subscriptions_endpoint;
DROP INDEX IF EXISTS idx_push_subscriptions_org_id;
DROP TABLE IF EXISTS push_subscriptions;

*/

-- =====================================================
-- NOTES
-- =====================================================

-- This table stores Web Push API subscriptions for clients
-- Each subscription is linked to an org_id for proper isolation
-- The endpoint is unique to prevent duplicate subscriptions
-- p256dh and auth are encryption keys from the browser's PushSubscription
-- RLS policies ensure org isolation when using authenticated context
-- Service role bypasses RLS for backend API operations

-- Expected usage:
-- 1. Client subscribes via /api/notifications/subscribe
-- 2. Backend stores subscription in this table
-- 3. When event occurs, backend queries subscriptions by org_id
-- 4. Backend sends push notification to all matching endpoints
-- 5. Client can unsubscribe, removing the row

-- =====================================================
-- END OF MIGRATION
-- =====================================================

