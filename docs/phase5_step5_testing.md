# Phase 5 Step 5: Testing Analytics Lite

## ✅ Implementation Complete

The Analytics Widget has been added to the client dashboard with:
- 7-day trend line chart using Recharts
- Summary stat cards (Total, Approved, Completed)
- "New this week" badge
- Auto-refresh every 30 seconds
- Responsive layout (desktop + mobile)
- Loading and error states

---

## 📁 Files Created

1. **`/src/app/api/analytics/summary/route.ts`** - Analytics API endpoint
2. **`/src/components/client/AnalyticsWidget.tsx`** - Analytics visualization component
3. Updated **`/src/components/client/ClientDashboard.tsx`** - Integrated analytics widget
4. **`/docs/phase5_step5_testing.md`** - This testing guide

---

## 🔧 Setup

### Required:
- ✅ Database has `org_id` column on `leads` table
- ✅ Environment variables set (from Steps 1-4)
- ✅ Test data with various dates
- ✅ Recharts package installed (`npm install recharts`)

---

## 🧪 Testing Steps

### Test 1: API Endpoint

**Test analytics API directly:**

```bash
curl "http://localhost:3000/api/analytics/summary?orgId=demo-org"
```

**Expected Response:**
```json
{
  "success": true,
  "orgId": "demo-org",
  "totalLeads": 25,
  "approved": 10,
  "completed": 8,
  "newStatus": 7,
  "newThisWeek": 5,
  "trend": [
    { "date": "2025-10-14", "count": 0 },
    { "date": "2025-10-15", "count": 1 },
    { "date": "2025-10-16", "count": 2 },
    { "date": "2025-10-17", "count": 0 },
    { "date": "2025-10-18", "count": 1 },
    { "date": "2025-10-19", "count": 0 },
    { "date": "2025-10-20", "count": 1 }
  ]
}
```

---

### Test 2: View Analytics Widget

1. **Generate an invite and access portal:**
   ```bash
   curl -X POST http://localhost:3000/api/client/invite \
     -H "Content-Type: application/json" \
     -H "x-admin-secret: test-secret-12345" \
     -d '{"orgId": "demo-org", "phone": "+393514421114", "ttlHours": 24}'
   ```

2. **Open the invite link in browser**

3. **Expected to see Analytics Widget:**
   - 📊 **"Analytics Overview"** heading with "Last 7 days"
   - 📈 **3 stat cards** in a row:
     - 🔵 Total Leads (blue)
     - 🟡 Approved (yellow)
     - 🟢 Completed (green)
   - 🎯 **"X new leads this week"** badge (if any)
   - 📉 **Line chart** showing 7-day trend
   - ⏱️ **Auto-refreshes** every 30 seconds

---

### Test 3: Chart Visualization

**With data in last 7 days:**
- ✅ Line chart displays with points
- ✅ X-axis shows dates (e.g., "Oct 20")
- ✅ Y-axis shows counts (integers only)
- ✅ Blue line connecting data points
- ✅ Dots on each data point
- ✅ Hover tooltip shows date and count
- ✅ Grid lines visible

**Without data (empty 7 days):**
- ✅ Shows "No leads created in the last 7 days" message
- ✅ Gray background placeholder
- ✅ No broken chart

---

### Test 4: Summary Cards

**Each card should show:**
- ✅ Large icon (8x8) on the left
- ✅ Large number (text-3xl, bold, colored)
- ✅ Label below number
- ✅ Light background (blue-50, yellow-50, green-50)
- ✅ Border matching theme
- ✅ Hover shadow effect

**Verify counts match:**
- Total Leads = All leads in database for org
- Approved = Leads with status 'APPROVED'
- Completed = Leads with status 'COMPLETED'

---

### Test 5: "New This Week" Badge

**If leads created in last 7 days:**
- ✅ Badge appears above chart
- ✅ Shows count and text
- ✅ Blue theme (bg-blue-50, text-blue-700)
- ✅ Trending up icon

**If no leads this week:**
- ✅ Badge hidden
- ✅ No empty space

---

### Test 6: Responsive Layout

**Desktop (≥768px):**
- ✅ Analytics widget full width
- ✅ 3 stat cards in a row
- ✅ Chart width matches container
- ✅ All readable and well-spaced

**Mobile (<768px):**
- ✅ Stat cards stack vertically
- ✅ Chart scales to mobile width
- ✅ All text readable
- ✅ Touch-friendly

---

### Test 7: Auto-Refresh

1. **Open dashboard**
2. **Wait 30 seconds**
3. **Watch for:**
   - Analytics updates automatically
   - No page refresh needed
   - Chart redraws smoothly

4. **Create a new lead** (via admin or API)
5. **Wait up to 30 seconds**
6. **Verify:**
   - Total count increases
   - Chart updates with new data point
   - "New this week" badge updates

---

### Test 8: Multiple Organizations

**Create test data for different orgs:**

```sql
-- Org A with recent activity
INSERT INTO leads (user_id, org_id, source, name, phone, description, status, created_at)
VALUES 
  ('c96933ac-8a2b-484b-b9df-8e25d04e7f29', 'org-a', 'Web', 'A1', '+15551111111', 'Test', 'NEW', NOW() - INTERVAL '1 day'),
  ('c96933ac-8a2b-484b-b9df-8e25d04e7f29', 'org-a', 'Web', 'A2', '+15552222222', 'Test', 'APPROVED', NOW() - INTERVAL '2 days'),
  ('c96933ac-8a2b-484b-b9df-8e25d04e7f29', 'org-a', 'Web', 'A3', '+15553333333', 'Test', 'COMPLETED', NOW() - INTERVAL '3 days');

-- Org B with different activity
INSERT INTO leads (user_id, org_id, source, name, phone, description, status, created_at)
VALUES 
  ('c96933ac-8a2b-484b-b9df-8e25d04e7f29', 'org-b', 'Web', 'B1', '+15554444444', 'Test', 'NEW', NOW() - INTERVAL '5 days'),
  ('c96933ac-8a2b-484b-b9df-8e25d04e7f29', 'org-b', 'Web', 'B2', '+15555555555', 'Test', 'NEW', NOW() - INTERVAL '6 days');
```

**Test isolation:**
1. Get invite for `org-a` → Should show 3 total leads, trend with 3 points
2. Get invite for `org-b` → Should show 2 total leads, different trend
3. Verify charts are independent

---

## 📊 Database Verification

### Verify counts match API:

```sql
SELECT 
  org_id,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'APPROVED') as approved,
  COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
  COUNT(*) FILTER (WHERE status = 'NEW') as new_status,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_this_week
FROM leads
WHERE org_id = 'demo-org'
GROUP BY org_id;
```

**Compare with Analytics Widget cards** - numbers should match exactly.

---

### Check 7-day trend data:

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as count
FROM leads
WHERE org_id = 'demo-org'
  AND created_at >= CURRENT_DATE - INTERVAL '6 days'
GROUP BY DATE(created_at)
ORDER BY date;
```

**Compare with chart** - each data point should match.

---

## 🎨 Visual Verification

### Analytics Widget Layout:

```
┌─────────────────────────────────────────────────┐
│ Analytics Overview              Last 7 days     │
├─────────────────────────────────────────────────┤
│ ┌────────┐  ┌────────┐  ┌────────┐            │
│ │ 📈 25  │  │ 📋 10  │  │ ✅ 8   │            │
│ │ Total  │  │ Apprvd │  │ Compltd│            │
│ └────────┘  └────────┘  └────────┘            │
│                                                 │
│ 📈 5 new leads this week                       │
│                                                 │
│ Lead Trend (7 Days)                            │
│ ┌─────────────────────────────────────────┐   │
│ │        /\                               │   │
│ │       /  \      /\                      │   │
│ │      /    \    /  \                     │   │
│ │     /      \  /    \___                 │   │
│ │____/        \/                          │   │
│ └─────────────────────────────────────────┘   │
│   Oct 14 15  16  17  18  19  20              │
└─────────────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Issue: "Failed to load analytics"

**Possible causes:**
1. org_id column doesn't exist
2. No leads for org
3. API endpoint error

**Debug:**
```bash
# Test API directly
curl "http://localhost:3000/api/analytics/summary?orgId=demo-org"

# Check database
SELECT COUNT(*) FROM leads WHERE org_id = 'demo-org';
```

---

### Issue: Chart not displaying

**Possible causes:**
1. Recharts not installed
2. All counts are zero
3. JavaScript error

**Fix:**
```bash
# Reinstall Recharts
npm install recharts

# Check browser console for errors
# Verify data in API response
```

---

### Issue: Wrong counts displayed

**Cause:** Data mismatch or filtering issue

**Verify:**
```sql
-- Check actual counts
SELECT status, COUNT(*) 
FROM leads 
WHERE org_id = 'demo-org'
GROUP BY status;

-- Compare with Analytics Widget
```

---

### Issue: Auto-refresh not working

**Check:**
1. Browser console for errors
2. Component is client component ('use client' at top)
3. useEffect dependencies correct

---

## 📈 Test Data Creation

### Create varied test data for better charts:

```sql
-- Create leads spread across last 7 days
DO $$
BEGIN
  FOR i IN 0..6 LOOP
    INSERT INTO leads (user_id, org_id, source, name, phone, description, status, created_at)
    VALUES (
      'c96933ac-8a2b-484b-b9df-8e25d04e7f29',
      'demo-org',
      'Test',
      'Test Lead ' || i,
      '+1555' || LPAD(i::text, 7, '0'),
      'Analytics test data',
      CASE WHEN random() < 0.3 THEN 'NEW'
           WHEN random() < 0.6 THEN 'APPROVED'
           ELSE 'COMPLETED' END,
      CURRENT_TIMESTAMP - (i || ' days')::INTERVAL
    );
  END LOOP;
END $$;
```

**This creates:**
- 7 leads, one per day for last 7 days
- Random status distribution
- Nice trend line in chart

---

## ✨ Success Criteria

When working correctly:

### Visual
- ✅ Analytics widget appears at top of dashboard
- ✅ 3 colorful stat cards with icons
- ✅ "New this week" badge (if applicable)
- ✅ Smooth line chart with blue theme
- ✅ Hover tooltips work on chart
- ✅ Responsive layout (desktop + mobile)

### Functional
- ✅ Counts match database exactly
- ✅ Trend data accurate for last 7 days
- ✅ Auto-refresh every 30 seconds
- ✅ Loading state shows while fetching
- ✅ Error state displays if API fails
- ✅ Empty state for no data

### Integration
- ✅ Works with invite system
- ✅ Respects org_id filtering
- ✅ Doesn't break existing dashboard features
- ✅ No console errors
- ✅ No linter errors

---

## 🎨 Component Features

### Stat Cards (3 cards)
| Card | Icon | Color | Shows |
|------|------|-------|-------|
| **Total Leads** | TrendingUp | Blue | All leads for org |
| **Approved** | ClipboardCheck | Yellow | APPROVED status count |
| **Completed** | CheckCircle | Green | COMPLETED status count |

### Chart Features
- **Type:** Line chart
- **Data:** Last 7 days of lead creation
- **X-Axis:** Dates (formatted as "Oct 20")
- **Y-Axis:** Lead count (integers only)
- **Style:** Blue line, grid, tooltips
- **Height:** 200px
- **Responsive:** Scales to container width

### New This Week Badge
- **Shows:** Count of leads created in last 7 days
- **Style:** Blue rounded pill with icon
- **Location:** Above chart
- **Conditional:** Only shows if count > 0

---

## 🧪 Curl Tests

### Test with orgId parameter:

```bash
curl "http://localhost:3000/api/analytics/summary?orgId=demo-org" | jq
```

**Expected:**
- `totalLeads`, `approved`, `completed` counts
- `newThisWeek` count
- `trend` array with 7 entries (one per day)

---

### Test with cookie (simulated):

```bash
# First get an invite and accept it (sets cookie)
# Then the API can read from cookie automatically

curl "http://localhost:3000/api/analytics/summary" \
  -b "ll_client_org=demo-org"
```

---

### Test missing orgId (should fail):

```bash
curl "http://localhost:3000/api/analytics/summary"
```

**Expected:** `400 Bad Request` - "Missing organization identifier"

---

## 📊 SQL Verification Queries

### Match total count:

```sql
SELECT COUNT(*) FROM leads WHERE org_id = 'demo-org';
-- Should match analytics.totalLeads
```

### Match status counts:

```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'APPROVED') as approved,
  COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
  COUNT(*) FILTER (WHERE status = 'NEW') as new_status
FROM leads 
WHERE org_id = 'demo-org';
-- Should match analytics cards
```

### Match "new this week":

```sql
SELECT COUNT(*) 
FROM leads 
WHERE org_id = 'demo-org'
  AND created_at >= NOW() - INTERVAL '7 days';
-- Should match "X new leads this week" badge
```

### Match trend data:

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as count
FROM leads
WHERE org_id = 'demo-org'
  AND created_at >= CURRENT_DATE - INTERVAL '6 days'
GROUP BY DATE(created_at)
ORDER BY date;
-- Should match chart data points
```

---

## 🎯 Visual Checklist

### Desktop Layout:
- [ ] Analytics widget full width at top
- [ ] 3 stat cards in one row
- [ ] Chart below cards
- [ ] All cards same height
- [ ] Proper spacing between sections

### Mobile Layout:
- [ ] Analytics widget full width
- [ ] Stat cards stack (3 rows)
- [ ] Chart scales to mobile width
- [ ] Text remains readable
- [ ] No horizontal scrolling

### Chart Styling:
- [ ] Blue line (#3b82f6)
- [ ] Smooth curves
- [ ] Grid lines visible but subtle
- [ ] Dots on data points (blue, 4px)
- [ ] Hover dots larger (6px)
- [ ] Tooltip appears on hover
- [ ] Axis labels readable

### Interactions:
- [ ] Hover over chart points shows tooltip
- [ ] Tooltip shows date and count
- [ ] Cards have hover shadow effect
- [ ] Auto-refresh happens (check timestamp)

---

## 🚀 Production Deployment

### Before deploying:

1. **Verify analytics on staging:**
   - Test with real production data
   - Check performance with large datasets
   - Verify chart renders correctly

2. **Environment variables in Vercel:**
   - All Phase 5 variables set
   - URLs point to production

3. **Performance considerations:**
   - Analytics endpoint caches for 30s
   - Chart only shows 7 days (limited data)
   - No heavy computations

---

## 📚 Related Files

- API: `/src/app/api/analytics/summary/route.ts`
- Widget: `/src/components/client/AnalyticsWidget.tsx`
- Dashboard: `/src/components/client/ClientDashboard.tsx`
- Testing: `/docs/phase5_step5_testing.md`

---

## 🎯 Phase 5 Complete!

With Step 5 done, you now have a **complete client portal** with:

| Step | Feature | Status |
|------|---------|--------|
| 1 | Client Portal Scaffold | ✅ COMPLETE |
| 2 | Enhanced Dashboard UI | ✅ COMPLETE |
| 3 | Invite Links System | ✅ COMPLETE |
| 4 | Lead Sharing Policies (RLS) | ✅ COMPLETE |
| 5 | **Analytics Lite** | ✅ COMPLETE |

---

## ✅ Complete Feature Set

Your client portal now has:
- ✅ Secure token-based invites
- ✅ Time-limited access tokens
- ✅ Cookie-based sessions
- ✅ Organization isolation
- ✅ Beautiful dashboard UI
- ✅ Summary statistics
- ✅ **Analytics with charts** ← NEW!
- ✅ 7-day trend visualization
- ✅ Auto-refreshing data
- ✅ Responsive design
- ✅ Mobile-friendly

---

## 🎉 What Clients Can See

**When a client accesses their portal:**

1. **Analytics Overview**
   - Total leads count
   - Approved and completed metrics
   - "New this week" highlight
   - 7-day trend chart

2. **Lead Summary**
   - Needs attention count
   - Approved count
   - Completed count

3. **Lead List**
   - All their leads
   - Contact information
   - Status badges
   - Relative timestamps

4. **Auto-Updates**
   - Analytics refresh every 30s
   - Fresh data without reload

---

## 🚀 Next Steps

**Optional Enhancements:**
- Export analytics as PDF/CSV
- More chart types (bar, pie)
- Date range selector
- Conversion funnel metrics
- Compare periods (this week vs last week)

**Production:**
- Run database migration (org_id column)
- Deploy to Vercel
- Send invites to real clients
- Monitor analytics usage

---

**Phase 5 is complete!** 🎊📊

Test the analytics by visiting: `http://localhost:3000/client/demo-org` (after accepting an invite)

