-- Phase 5 Step 4: Row-Level Security (RLS) Policies
-- Run this in Supabase SQL Editor

-- ============================================================
-- STEP 1: Add org_id column if not exists (from Phase 5 Step 1)
-- ============================================================

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS org_id TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_org_id ON leads(org_id);

-- Optional: Set default org_id for existing leads
UPDATE leads 
SET org_id = 'demo-org' 
WHERE org_id IS NULL;

-- ============================================================
-- STEP 2: Enable Row-Level Security
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 3: Drop existing overly permissive policies
-- ============================================================

-- Drop old "allow all" policies if they exist
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Allow all operations on leads" ON leads;
DROP POLICY IF EXISTS "Allow all operations on events" ON events;

-- ============================================================
-- STEP 4: Create Service Role Policies (Backend/Admin Access)
-- ============================================================

-- Service role has FULL access to everything (bypasses RLS anyway, but explicit)
CREATE POLICY "Service role full access to users"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to leads"
  ON leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to events"
  ON events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- STEP 5: Create Anonymous/Client Policies (Client Portal Access)
-- ============================================================

-- Clients can only SELECT their own organization's leads
CREATE POLICY "Clients can view own org leads"
  ON leads
  FOR SELECT
  TO anon, authenticated
  USING (
    org_id = current_setting('request.jwt.claims', true)::json->>'org_id'
  );

-- Clients can view events related to their org leads
CREATE POLICY "Clients can view own org events"
  ON events
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Allow if event has no lead_id (system events)
    lead_id IS NULL
    OR
    -- Allow if lead belongs to their org
    EXISTS (
      SELECT 1 FROM leads 
      WHERE leads.id = events.lead_id 
        AND leads.org_id = current_setting('request.jwt.claims', true)::json->>'org_id'
    )
  );

-- Clients cannot modify anything (read-only portal)
-- No INSERT, UPDATE, or DELETE policies for anon/authenticated

-- ============================================================
-- STEP 6: Verification Queries
-- ============================================================

-- Check RLS is enabled
SELECT 
  schemaname,
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'leads', 'events');
-- Should show rowsecurity = true

-- List all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('users', 'leads', 'events')
ORDER BY tablename, policyname;

-- ============================================================
-- ROLLBACK (if needed)
-- ============================================================

-- To disable RLS and remove policies:
/*
DROP POLICY IF EXISTS "Service role full access to users" ON users;
DROP POLICY IF EXISTS "Service role full access to leads" ON leads;
DROP POLICY IF EXISTS "Service role full access to events" ON events;
DROP POLICY IF EXISTS "Clients can view own org leads" ON leads;
DROP POLICY IF EXISTS "Clients can view own org events" ON events;

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
*/

