# Phase 5 Step 4: Testing Lead Sharing Policies (RLS)

## ✅ Implementation Complete

Row-Level Security has been configured for the client portal with:
- RLS policies on `users`, `leads`, and `events` tables
- Service role (admin) maintains full access
- Anonymous/client roles restricted to their organization
- Database migration script for easy deployment
- Application-level enforcement in API routes

---

## 📁 Files Created

1. **`/docs/migrations/phase5_rls_policies.sql`** - Complete RLS setup
2. **`/docs/phase5_step4_testing.md`** - This file

---

## 🗄️ Database Setup

### Step 1: Run the Migration

**In Supabase SQL Editor**, run the migration script:

📄 **File:** `/docs/migrations/phase5_rls_policies.sql`

Or manually execute these steps:

#### A. Add org_id Column (if not exists)

```sql
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS org_id TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_org_id ON leads(org_id);

-- Set default for existing leads
UPDATE leads 
SET org_id = 'demo-org' 
WHERE org_id IS NULL;
```

#### B. Enable RLS

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
```

#### C. Drop Old Policies

```sql
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Allow all operations on leads" ON leads;
DROP POLICY IF EXISTS "Allow all operations on events" ON events;
```

#### D. Create Service Role Policies

```sql
-- Full access for backend (service_role key)
CREATE POLICY "Service role full access to users"
  ON users FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to leads"
  ON leads FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to events"
  ON events FOR ALL TO service_role
  USING (true) WITH CHECK (true);
```

#### E. Create Client Policies (Read-Only)

```sql
-- Clients can only view their org's leads
CREATE POLICY "Clients can view own org leads"
  ON leads
  FOR SELECT
  TO anon, authenticated
  USING (
    org_id = current_setting('request.jwt.claims', true)::json->>'org_id'
  );

-- Clients can view relevant events
CREATE POLICY "Clients can view own org events"
  ON events
  FOR SELECT
  TO anon, authenticated
  USING (
    lead_id IS NULL
    OR
    EXISTS (
      SELECT 1 FROM leads 
      WHERE leads.id = events.lead_id 
        AND leads.org_id = current_setting('request.jwt.claims', true)::json->>'org_id'
    )
  );
```

---

## 🔐 How RLS Works

### Service Role (Backend)
- **Key:** `SUPABASE_SERVICE_ROLE_KEY`
- **Used by:** All server-side API routes
- **Access:** **Full** - bypasses RLS entirely
- **Routes:** `/api/leads/*`, `/api/cron/*`, `/api/summary/*`, etc.

### Anonymous/Authenticated Role (Future Client-Side)
- **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Used by:** Future client-side features
- **Access:** **Limited** - restricted by RLS policies
- **Filters:** Only see data where `org_id` matches JWT claim

---

## 🧪 Testing Steps

### Test 1: Verify RLS is Enabled

Run in Supabase SQL Editor:

```sql
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'leads', 'events');
```

**Expected:**
```
tablename | rowsecurity
----------|------------
users     | true
leads     | true
events    | true
```

---

### Test 2: Verify Policies Exist

```sql
SELECT 
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('users', 'leads', 'events')
ORDER BY tablename, policyname;
```

**Expected:** At least 5 policies (3 service_role + 2 client policies)

---

### Test 3: Service Role Access (Should Work)

**The backend should still work normally:**

```bash
# Admin dashboard should load all leads
curl http://localhost:3000/api/leads
```

**Expected:** All leads returned (RLS bypassed by service_role)

---

### Test 4: Client Portal Access (Org-Filtered)

1. **Create test data for multiple orgs:**

```sql
-- Ensure multiple orgs exist
INSERT INTO leads (user_id, org_id, source, name, phone, description, status)
VALUES 
  ('c96933ac-8a2b-484b-b9df-8e25d04e7f29', 'org-a', 'Web', 'User A1', '+15551111111', 'Org A lead', 'NEW'),
  ('c96933ac-8a2b-484b-b9df-8e25d04e7f29', 'org-a', 'Web', 'User A2', '+15552222222', 'Org A lead', 'NEW'),
  ('c96933ac-8a2b-484b-b9df-8e25d04e7f29', 'org-b', 'Web', 'User B1', '+15553333333', 'Org B lead', 'NEW'),
  ('c96933ac-8a2b-484b-b9df-8e25d04e7f29', 'org-b', 'Web', 'User B2', '+15554444444', 'Org B lead', 'NEW');
```

2. **Generate invite for org-a:**

```bash
curl -X POST http://localhost:3000/api/client/invite \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: test-secret-12345" \
  -d '{"orgId": "org-a", "phone": "+15551111111", "ttlHours": 24}'
```

3. **Open the link in browser**

4. **Expected:**
   - Only sees User A1 and User A2
   - Does NOT see User B1 or B2
   - Summary shows count: 2

5. **Repeat for org-b:**

```bash
curl -X POST http://localhost:3000/api/client/invite \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: test-secret-12345" \
  -d '{"orgId": "org-b", "phone": "+15553333333", "ttlHours": 24}'
```

6. **Expected:**
   - Only sees User B1 and User B2
   - Does NOT see User A1 or A2

---

### Test 5: Cross-Org Access Blocked

1. **Get invite for org-a** (sets cookie `ll_client_org=org-a`)

2. **Try to manually access org-b:**
   ```
   http://localhost:3000/client/org-b
   ```

3. **Expected:**
   - ✅ "Access Required" page shown
   - ✅ Cookie doesn't grant access to different org
   - ✅ Application-level enforcement working

---

## 🔍 Verification Queries

### Check org_id distribution:

```sql
SELECT 
  org_id,
  COUNT(*) as lead_count,
  COUNT(*) FILTER (WHERE status = 'NEW') as new,
  COUNT(*) FILTER (WHERE status = 'APPROVED') as approved,
  COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed
FROM leads
WHERE org_id IS NOT NULL
GROUP BY org_id
ORDER BY lead_count DESC;
```

### Test RLS as anon user:

```sql
-- This simulates what a client would see
-- (In practice, RLS doesn't apply to service_role queries)

SET ROLE anon;

-- Should return error or no rows (no JWT claim set)
SELECT * FROM leads LIMIT 10;

-- Reset to normal
RESET ROLE;
```

### Verify no NULL org_ids:

```sql
SELECT COUNT(*) 
FROM leads 
WHERE org_id IS NULL;

-- Should return 0
```

---

## 🛠️ Current Architecture

### Backend API Routes (Admin)
**Uses:** `supabaseAdmin` (service role key)  
**RLS:** Bypassed  
**Access:** Full access to all data  
**Routes:**
- `/api/leads/*`
- `/api/cron/*`
- `/api/summary/*`
- `/api/events/*`

### Client Portal Routes
**Uses:** `supabaseAdmin` (service role key) + application-level filtering  
**RLS:** Bypassed, but filtered by `org_id` in application code  
**Access:** Only sees data for authenticated org  
**Routes:**
- `/api/client/leads?orgId=...` - Already filters by org_id
- `/client/[orgId]` - Cookie-based org validation

---

## 🔐 Security Layers

### Layer 1: Application-Level Filtering ✅
- **Current implementation**
- Cookie validation in page component
- Query filtering by `org_id` in API route
- Working now

### Layer 2: RLS Policies ✅
- **Defense in depth**
- Database-level enforcement
- Protects against application bugs
- Ready for future client-side features

### Layer 3: Token Authentication ✅
- **Invite system**
- Time-limited access
- HMAC-signed tokens
- Cookie-based sessions

---

## 🧩 Environment Variable

### Add to .env.local:

```bash
# Already set from previous steps
CLIENT_PORTAL_SECRET=...
REQUIRE_CLIENT_INVITE=true

# New for Step 4 (optional flag)
REQUIRE_CLIENT_RLS=true
```

**Purpose:** Future flag for toggling RLS-based vs application-based filtering.

**Current:** RLS is enabled at database level, but application uses service_role which bypasses it.

---

## 🐛 Troubleshooting

### Issue: "column leads.org_id does not exist"

**Seen in logs:**
```
[ClientAPI] Failed to fetch leads: {
  code: '42703',
  message: 'column leads.org_id does not exist'
}
```

**Fix:**
Run Step 1 of the migration (add org_id column)

---

### Issue: RLS blocking admin access

**Symptom:** Admin dashboard shows no leads

**Cause:** Using wrong Supabase client

**Fix:**
- Backend routes must use `supabaseAdmin` (service role)
- Client routes must use `supabase` (anon key) for RLS to apply
- Check which client is being used

---

### Issue: Client sees all orgs' data

**Cause:** RLS policy not working or using service_role key

**Fix:**
1. Verify RLS is enabled: `SELECT rowsecurity FROM pg_tables WHERE tablename='leads'`
2. Check which Supabase client is being used
3. Verify org_id values are set correctly

---

### Issue: No data visible in client portal

**Possible causes:**
1. org_id column is NULL
2. RLS blocking legitimate access
3. Wrong org_id in cookie

**Debug:**
```sql
-- Check org_id values
SELECT id, name, org_id FROM leads LIMIT 10;

-- Temporarily disable RLS to test
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
-- (Re-enable after testing)
```

---

## 📊 Migration Verification

### After running migration:

**1. Check column exists:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'leads' AND column_name = 'org_id';

-- Should return: org_id | text
```

**2. Check index exists:**
```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'leads' AND indexname = 'idx_leads_org_id';

-- Should return: idx_leads_org_id
```

**3. Check RLS enabled:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'leads', 'events');

-- All should be true
```

**4. Check policies exist:**
```sql
SELECT COUNT(*) FROM pg_policies 
WHERE tablename IN ('users', 'leads', 'events');

-- Should return 5 or more
```

---

## ✨ Success Criteria

When working correctly:

### Database Level
- ✅ RLS enabled on users, leads, events tables
- ✅ Service role policies grant full access
- ✅ Client policies restrict to org_id
- ✅ org_id column exists with index
- ✅ All existing leads have org_id set

### Application Level
- ✅ Backend routes use service_role (full access)
- ✅ Client routes filter by org_id
- ✅ Cookie validation enforces org isolation
- ✅ No cross-org data leakage

### Testing
- ✅ Multiple orgs can coexist
- ✅ Each org sees only their data
- ✅ Admin sees all data
- ✅ Invite system creates proper org access
- ✅ No build or linter errors

---

## 🎯 Architecture Notes

### Current Implementation (Phase 5 Steps 1-4)

**Server-Side Rendering:**
- All client portal pages are Server Components
- Fetch data server-side using `supabaseAdmin` (service_role)
- Filter by `org_id` in application code
- RLS is bypassed (service_role ignores RLS)

**Why this works:**
- ✅ Simpler implementation
- ✅ No client-side secrets
- ✅ Server components are secure
- ✅ Application-level filtering is explicit

**RLS Policies:**
- Present as **defense in depth**
- Will activate if we add client-side features in the future
- Protects against application bugs

---

### Future Enhancement (Optional)

To fully leverage RLS with client-side fetching:

**1. Use anon key in client components:**
```typescript
// In a 'use client' component
import { supabase } from '@/libs/supabaseClient';

// This would respect RLS policies
const { data } = await supabase
  .from('leads')
  .select('*');
```

**2. Set JWT claim based on cookie:**
```typescript
// Middleware to set org_id claim
// Would require custom JWT signing
```

**3. Enable real-time subscriptions:**
```typescript
// Client-side realtime with RLS filtering
supabase
  .channel('leads')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'leads' 
  }, handleChange)
  .subscribe();
```

**For now:** Server-side filtering is sufficient and secure.

---

## 🚀 Production Deployment

### Before Deploying:

1. ✅ Run migration on production Supabase
2. ✅ Verify all existing leads have `org_id` set
3. ✅ Test with production data
4. ✅ Ensure `CLIENT_PORTAL_SECRET` is set in Vercel
5. ✅ Backup database before enabling RLS

### Deployment Steps:

1. **Backup database:**
   ```sql
   -- In Supabase, use the backup feature
   -- Or export tables
   ```

2. **Run migration** on production Supabase

3. **Verify policies:**
   ```sql
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE tablename IN ('leads', 'events', 'users');
   ```

4. **Test admin access:**
   - Visit admin dashboard
   - Ensure all leads visible

5. **Test client access:**
   - Generate invite for test org
   - Verify only org data visible

---

## 📚 Related Files

- Migration: `/docs/migrations/phase5_rls_policies.sql`
- Schema: `/docs/schema.sql` (updated with org_id)
- API Route: `/src/app/api/client/leads/route.ts`
- Portal Page: `/src/app/client/[orgId]/page.tsx`
- Testing: `/docs/phase5_step4_testing.md`

---

## 🎉 Phase 5 Step 4 Complete!

You now have:
- ✅ **Step 1:** Client Portal Scaffold
- ✅ **Step 2:** Enhanced Dashboard UI
- ✅ **Step 3:** Invite Links System
- ✅ **Step 4:** Lead Sharing Policies (RLS)

**Next:** Phase 5 Step 5 - Analytics Lite

---

## 🔍 Quick Verification

**After running the migration:**

```bash
# 1. Generate invite
curl -X POST http://localhost:3000/api/client/invite \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: test-secret-12345" \
  -d '{"orgId": "demo-org", "phone": "+393514421114", "ttlHours": 24}'

# 2. Open the link in browser

# 3. Verify dashboard loads (should show org's leads now)
```

**If you see:** "Error loading leads" → Run the migration (org_id column missing)

**If you see:** Dashboard with leads → ✅ Everything working!

---

**RLS policies are configured and ready!** 🔐

