# Phase 5 Step 1: Testing Client Portal Scaffold

## ✅ Implementation Complete

The client portal scaffold has been created with:
- Secure API endpoint with token authentication
- Read-only access to organization leads
- Summary statistics and lead list
- Responsive design (desktop table, mobile cards)
- Server-side rendering for security

---

## 📁 Files Created

1. **`/src/app/api/client/leads/route.ts`** - API endpoint
2. **`/src/components/client/ClientSummary.tsx`** - Summary cards
3. **`/src/components/client/ClientLeadList.tsx`** - Leads table/list
4. **`/src/app/client/[orgId]/page.tsx`** - Client portal page
5. **`/src/libs/time.ts`** - Added relativeTime function
6. **`/docs/phase5_step1_testing.md`** - This file

---

## 🔧 Setup Requirements

### 1. Add org_id Column to Database

The `leads` table needs an `org_id` column. Run this in **Supabase SQL Editor**:

```sql
-- Add org_id column to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS org_id TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_leads_org_id ON leads(org_id);

-- Optionally: Set a default org_id for existing leads
UPDATE leads 
SET org_id = 'demo-org' 
WHERE org_id IS NULL;
```

---

### 2. Set Environment Variable

Add to your `.env.local`:

```bash
# Generate with: openssl rand -hex 32
CLIENT_PORTAL_SECRET=your-random-hex-here
```

**Generate secure secret:**
```bash
openssl rand -hex 32
```

**Example `.env.local` addition:**
```bash
CLIENT_PORTAL_SECRET=a3f8d9e2b1c4567890abcdef1234567890abcdef1234567890abcdef12345678
```

---

### 3. Add to Vercel Environment Variables

When deploying:
1. Go to Vercel → Settings → Environment Variables
2. Add: `CLIENT_PORTAL_SECRET` = `[your-secret]`
3. Deploy

---

## 🧪 Testing Steps

### Test 1: API Authentication (Should Fail)

**Without token:**
```bash
curl "http://localhost:3000/api/client/leads?orgId=demo-org"
```

**Expected Response:** `401 Unauthorized`
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

**With invalid token:**
```bash
curl "http://localhost:3000/api/client/leads?orgId=demo-org" \
  -H "x-client-token: invalid-token"
```

**Expected Response:** `401 Unauthorized`

---

### Test 2: API with Valid Token (Should Succeed)

```bash
curl "http://localhost:3000/api/client/leads?orgId=demo-org" \
  -H "x-client-token: YOUR_SECRET_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "orgId": "demo-org",
  "total": 0,
  "leads": []
}
```

---

### Test 3: API Missing orgId Parameter

```bash
curl "http://localhost:3000/api/client/leads" \
  -H "x-client-token: YOUR_SECRET_HERE"
```

**Expected Response:** `400 Bad Request`
```json
{
  "success": false,
  "error": "Missing orgId parameter"
}
```

---

### Test 4: Seed Test Data

Run this in **Supabase SQL Editor**:

```sql
-- Create some test leads for demo-org
INSERT INTO leads (user_id, org_id, source, name, phone, description, status, created_at)
VALUES 
  (
    'c96933ac-8a2b-484b-b9df-8e25d04e7f29',
    'demo-org',
    'Website',
    'Alice Johnson',
    '+15551234567',
    'Interested in our services',
    'NEW',
    NOW() - INTERVAL '2 hours'
  ),
  (
    'c96933ac-8a2b-484b-b9df-8e25d04e7f29',
    'demo-org',
    'Referral',
    'Bob Smith',
    '+15559876543',
    'Looking for quotes',
    'APPROVED',
    NOW() - INTERVAL '1 day'
  ),
  (
    'c96933ac-8a2b-484b-b9df-8e25d04e7f29',
    'demo-org',
    'Phone',
    'Carol White',
    '+15555551234',
    'Follow-up needed',
    'COMPLETED',
    NOW() - INTERVAL '3 days'
  ),
  (
    'c96933ac-8a2b-484b-b9df-8e25d04e7f29',
    'another-org',
    'Website',
    'Dave Brown',
    '+15555555555',
    'Different organization',
    'NEW',
    NOW()
  );
```

---

### Test 5: View Client Portal

1. **Navigate to:**
   ```
   http://localhost:3000/client/demo-org
   ```

2. **Expected to see:**
   - ✅ "Client Portal" heading
   - ✅ "Organization: demo-org" subheader
   - ✅ Summary cards showing:
     - Total Leads: 3
     - Needs Attention: 1
     - Approved: 1
     - Completed: 1
   - ✅ Table/list with 3 leads:
     - Alice Johnson (red badge - Needs Attention)
     - Bob Smith (yellow badge - Approved)
     - Carol White (green badge - Completed)
   - ✅ Relative timestamps ("2 hours ago", "1 day ago", etc.)
   - ✅ Phone numbers are clickable tel: links

3. **Test responsive design:**
   - Desktop: Table view
   - Mobile: Stacked card view

---

### Test 6: Different Organization

1. **Navigate to:**
   ```
   http://localhost:3000/client/another-org
   ```

2. **Expected to see:**
   - Total Leads: 1
   - Only "Dave Brown" in the list
   - Different org's data is properly filtered

---

### Test 7: Non-Existent Organization

1. **Navigate to:**
   ```
   http://localhost:3000/client/non-existent-org
   ```

2. **Expected to see:**
   - "No leads yet" message
   - All summary cards show 0

---

### Test 8: API Returns Correct Data

```bash
# Should return 3 leads
curl "http://localhost:3000/api/client/leads?orgId=demo-org" \
  -H "x-client-token: YOUR_SECRET_HERE" | jq '.total'

# Should return 1 lead
curl "http://localhost:3000/api/client/leads?orgId=another-org" \
  -H "x-client-token: YOUR_SECRET_HERE" | jq '.total'

# Should return 0 leads
curl "http://localhost:3000/api/client/leads?orgId=non-existent" \
  -H "x-client-token: YOUR_SECRET_HERE" | jq '.total'
```

---

## 🔍 Verification Checklist

### Security
- [ ] API returns 401 without x-client-token header
- [ ] API returns 401 with invalid x-client-token
- [ ] CLIENT_PORTAL_SECRET never exposed to browser
- [ ] Page uses server component (not client-side fetch)

### Functionality
- [ ] Page loads without errors for valid orgId
- [ ] Summary cards show correct counts
- [ ] Leads filtered by org_id correctly
- [ ] Phone numbers are clickable
- [ ] Relative timestamps work
- [ ] Responsive design (desktop table, mobile cards)

### Edge Cases
- [ ] Empty state shows "No leads yet"
- [ ] Different orgs see only their leads
- [ ] Missing orgId parameter returns 400
- [ ] API errors display user-friendly message

---

## 🐛 Troubleshooting

### Issue: "Configuration error" on page

**Cause:** `CLIENT_PORTAL_SECRET` not set in environment

**Fix:**
1. Add to `.env.local`:
   ```bash
   CLIENT_PORTAL_SECRET=$(openssl rand -hex 32)
   ```
2. Restart dev server: `npm run dev`

---

### Issue: "Error loading leads" on page

**Possible causes:**
1. Database doesn't have `org_id` column
2. API endpoint not accessible
3. Environment variable mismatch

**Fix:**
1. Run schema migration (see Setup step 1)
2. Check browser console for errors
3. Test API directly with curl
4. Verify environment variable is set

---

### Issue: API returns 500 error

**Check:**
1. Supabase credentials are correct
2. `org_id` column exists on `leads` table
3. Check API logs in terminal

**Test database:**
```sql
-- Verify column exists
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'leads' AND column_name = 'org_id';

-- Should return: org_id | text
```

---

### Issue: No leads showing but database has data

**Check:**
1. Verify leads have `org_id` set:
   ```sql
   SELECT id, name, org_id FROM leads LIMIT 5;
   ```
2. Ensure using correct orgId in URL
3. Check browser console for JavaScript errors

---

## 📊 Database Queries for Testing

### View leads by org:
```sql
SELECT org_id, COUNT(*) as count, 
       COUNT(*) FILTER (WHERE status = 'NEW') as new,
       COUNT(*) FILTER (WHERE status = 'APPROVED') as approved,
       COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed
FROM leads
GROUP BY org_id
ORDER BY count DESC;
```

### Find leads without org_id:
```sql
SELECT COUNT(*) FROM leads WHERE org_id IS NULL;
```

### Assign org_id to existing leads:
```sql
UPDATE leads 
SET org_id = 'demo-org' 
WHERE org_id IS NULL 
  AND user_id = 'c96933ac-8a2b-484b-b9df-8e25d04e7f29';
```

---

## 🎨 Visual Verification

### Summary Cards (4 cards in a row on desktop):
- **Total Leads** - Blue border and background
- **Needs Attention** - Red border and background  
- **Approved** - Yellow border and background
- **Completed** - Green border and background

### Lead List:
- **Desktop:** Table with columns: Name, Phone, Source, Status, Created
- **Mobile:** Stacked cards with all info
- **Status badges:**
  - 🔴 Red badge: "Needs Attention" (NEW)
  - 🟡 Yellow badge: "Approved" (APPROVED)
  - 🟢 Green badge: "Completed" (COMPLETED)

---

## 🚀 Production Deployment

### Vercel Setup:
1. Set `CLIENT_PORTAL_SECRET` in environment variables
2. Ensure `NEXT_PUBLIC_APP_URL` points to production URL
3. Run database migration on production Supabase

### Security Notes:
- ✅ Token authentication required for API
- ✅ Server-side rendering (no client-side secrets)
- ✅ Read-only database queries
- ✅ SQL injection protected (parameterized queries)

### Future Enhancements (Phase 5 Steps 2-4):
- Per-organization tokens (more granular access)
- Supabase RLS for additional security layer
- Real-time updates via Supabase Realtime
- Export leads as CSV
- Filtering and search capabilities

---

## ✨ Success Criteria

When working correctly:

- ✅ `/client/[orgId]` page renders without errors
- ✅ API enforces token authentication
- ✅ Leads filtered by organization
- ✅ Summary cards show accurate counts
- ✅ Lead list displays all fields correctly
- ✅ Phone numbers are clickable
- ✅ Relative timestamps work ("X ago")
- ✅ Responsive design (table on desktop, cards on mobile)
- ✅ Empty state displays correctly
- ✅ Error state displays user-friendly message
- ✅ No TypeScript or ESLint errors
- ✅ CLIENT_PORTAL_SECRET never exposed to browser

---

## 📚 Related Files

- API Route: `/src/app/api/client/leads/route.ts`
- Page: `/src/app/client/[orgId]/page.tsx`
- Components:
  - `/src/components/client/ClientSummary.tsx`
  - `/src/components/client/ClientLeadList.tsx`
- Utilities: `/src/libs/time.ts`
- Schema: `/docs/schema.sql`

---

## 🎉 Phase 5 Step 1 Complete!

You now have:
- ✅ Secure client portal scaffold
- ✅ Token-authenticated API
- ✅ Organization-filtered lead views
- ✅ Responsive summary and list components
- ✅ Server-side rendering for security

**Ready for Phase 5 Step 2:** Per-organization tokens and enhanced security!

