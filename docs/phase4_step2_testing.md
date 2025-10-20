# Phase 4 Step 2: Testing Auto-Cleanup of Old Leads & Events

## ✅ Implementation Complete

The cleanup cron endpoint has been created at `/src/app/api/cron/cleanup/route.ts`.

---

## 🔧 Environment Setup

### Required Environment Variables

Add these to your `.env.local` file:

```bash
# Already configured from Step 1
CRON_SECRET=your-secure-random-secret-here

# New for Step 2 - Cleanup Configuration
CLEANUP_LEAD_RETENTION_DAYS=30
CLEANUP_EVENT_RETENTION_DAYS=60
```

**Default Values:**
- If not set, leads are deleted after **30 days**
- If not set, events are deleted after **60 days**

### For Vercel Production

Add the cleanup variables in your Vercel dashboard:
1. Go to your project → Settings → Environment Variables
2. Add: `CLEANUP_LEAD_RETENTION_DAYS` = `30`
3. Add: `CLEANUP_EVENT_RETENTION_DAYS` = `60`
4. Deploy to apply the changes

---

## 🧪 Local Testing

### Test 1: Without Authorization (Should Fail)

```bash
curl http://localhost:3000/api/cron/cleanup
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

Status: `401 Unauthorized`

---

### Test 2: With Valid Secret (Should Succeed)

```bash
curl -X POST http://localhost:3000/api/cron/cleanup \
  -H "x-cron-secret: your-secure-random-secret-here"
```

**Expected Response:**
```json
{
  "success": true,
  "leadsDeleted": 4,
  "eventsDeleted": 12,
  "timestamp": "2025-10-20T03:00:00.000Z",
  "retention": {
    "leadDays": 30,
    "eventDays": 60
  }
}
```

---

### Test 3: Create Old Test Data

To test the cleanup properly, you need some old data. Run this in **Supabase SQL Editor**:

```sql
-- Create a test lead older than 30 days with COMPLETED status
INSERT INTO leads (
  user_id, 
  source, 
  name, 
  phone, 
  description, 
  status, 
  created_at
)
VALUES (
  'c96933ac-8a2b-484b-b9df-8e25d04e7f29',
  'Test Cleanup',
  'Old Test Lead',
  '+15551234567',
  'This lead should be deleted by cleanup',
  'COMPLETED',
  NOW() - INTERVAL '35 days'
);

-- Create an old event (older than 60 days)
INSERT INTO events (
  event_type,
  lead_id,
  actor_id,
  metadata,
  created_at
)
VALUES (
  'test.old_event',
  NULL,
  'c96933ac-8a2b-484b-b9df-8e25d04e7f29',
  '{"test": "old event for cleanup"}',
  NOW() - INTERVAL '65 days'
);

-- Verify they were created
SELECT id, name, status, created_at 
FROM leads 
WHERE status IN ('COMPLETED', 'RECONCILED') 
  AND created_at < NOW() - INTERVAL '30 days';

SELECT id, event_type, created_at 
FROM events 
WHERE created_at < NOW() - INTERVAL '60 days';
```

---

### Test 4: Run Cleanup & Verify Deletion

```bash
# Run the cleanup
curl -X POST http://localhost:3000/api/cron/cleanup \
  -H "x-cron-secret: your-secret-here"

# Expected: leadsDeleted >= 1, eventsDeleted >= 1
```

**Verify in Supabase SQL Editor:**

```sql
-- Check if old leads were deleted
SELECT id, name, status, created_at 
FROM leads 
WHERE status IN ('COMPLETED', 'RECONCILED') 
  AND created_at < NOW() - INTERVAL '30 days';
-- Should return 0 rows

-- Check if old events were deleted  
SELECT id, event_type, created_at 
FROM events 
WHERE created_at < NOW() - INTERVAL '60 days';
-- Should return 0 rows (except maybe the cleanup.run events themselves)
```

---

### Test 5: Verify Cleanup Event Logged

```sql
SELECT 
  event_type,
  created_at,
  metadata->>'leads_deleted' as leads_deleted,
  metadata->>'events_deleted' as events_deleted,
  metadata->>'triggered_by' as triggered_by,
  metadata
FROM events
WHERE event_type = 'cleanup.run'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:** New `cleanup.run` event with metadata showing deletion counts.

---

## 🚀 Production Setup (Vercel Cron)

### Configure Cron Job in Vercel Dashboard

1. Go to your Vercel project
2. Navigate to: **Settings → Cron Jobs**
3. Click **Add Cron Job**
4. Configure:
   - **Path:** `/api/cron/cleanup`
   - **Schedule:** `0 3 * * *` (3:00 AM UTC daily)
   - **Custom Headers:**
     ```
     x-cron-secret: your-secure-random-secret-here
     ```
5. Save

**Recommended Schedule:** Daily at 3:00 AM (low traffic time)
- `0 3 * * *` = 3:00 AM UTC

---

## 📊 What Gets Deleted

### Leads Cleanup
**Criteria:**
- Status = `COMPLETED` OR `RECONCILED`
- Created more than `CLEANUP_LEAD_RETENTION_DAYS` ago (default: 30 days)

**NOT Deleted:**
- Leads with status `NEW` or `APPROVED` (active leads)
- Recent completed/reconciled leads (within retention period)

### Events Cleanup
**Criteria:**
- Created more than `CLEANUP_EVENT_RETENTION_DAYS` ago (default: 60 days)

**Note:** All event types are cleaned equally. Consider keeping `cleanup.run` events longer if needed.

---

## 🔍 Monitoring & Verification

### Check Vercel Logs

After cron runs, check logs for:
```
[Cleanup] Starting cleanup job
[Cleanup] Retention periods { leadRetentionDays: 30, eventRetentionDays: 60 }
[Cleanup] Deleted old leads { count: 4 }
[Cleanup] Deleted old events { count: 12 }
[Cleanup] Logged cleanup.run event
[Cleanup] Cleanup job completed successfully { leadsDeleted: 4, eventsDeleted: 12 }
```

### Monitor Database Size

Check Supabase dashboard to see storage trends over time.

### Set Up Alerts (Optional)

Create a query to alert if cleanup hasn't run:

```sql
-- Alert if no cleanup has run in last 2 days
SELECT 
  MAX(created_at) as last_cleanup,
  NOW() - MAX(created_at) as time_since_cleanup
FROM events
WHERE event_type = 'cleanup.run';
```

---

## 🐛 Troubleshooting

### "Unauthorized" Error
- Same as Step 1: verify `CRON_SECRET` is set correctly

### No Data Deleted (0 counts)
- **Expected:** If there's no old data, counts will be 0
- Verify with SQL queries that old data exists
- Check retention day settings are appropriate

### "Failed to delete leads" Error
- Check database permissions for service role
- Verify foreign key constraints on `leads` table
- Check if cascading deletes are configured properly

### Events Growing Too Fast
- Reduce `CLEANUP_EVENT_RETENTION_DAYS` (e.g., to 30 days)
- Consider archiving instead of deleting critical events
- Implement selective cleanup (keep certain event types longer)

---

## ⚙️ Advanced Configuration

### Different Retention for Different Statuses

To keep `RECONCILED` longer than `COMPLETED`, modify the cleanup route:

```typescript
// In cleanup/route.ts, replace the delete query with:
const { data: completedLeads } = await supabaseAdmin
  .from('leads')
  .select('id')
  .eq('status', 'COMPLETED')
  .lt('created_at', completedCutoff.toISOString());

const { data: reconciledLeads } = await supabaseAdmin
  .from('leads')
  .select('id')
  .eq('status', 'RECONCILED')
  .lt('created_at', reconciledCutoff.toISOString());
```

### Archive Instead of Delete

For compliance or auditing:

1. Create an `archived_leads` table
2. Before deleting, insert into archive table
3. Then delete from main table

---

## ✨ Success Criteria

- ✅ Cleanup endpoint created with CRON_SECRET auth
- ✅ Deletes old COMPLETED/RECONCILED leads
- ✅ Deletes old events
- ✅ Configurable retention periods via env vars
- ✅ Logs `cleanup.run` event with deletion counts
- ✅ Returns JSON success response with counts
- ✅ Handles errors gracefully
- ⏳ Configure in Vercel (manual step)
- ⏳ Verify cleanup runs nightly
- ⏳ Monitor database size trends

---

## 📈 Expected Impact

**Before Cleanup:**
- Database grows indefinitely
- Query performance degrades over time
- Storage costs increase

**After Cleanup:**
- Stable database size
- Consistent query performance
- Predictable storage costs
- Clean audit trail (via `cleanup.run` events)

---

## 🔗 Related Files

- Implementation: `/src/app/api/cron/cleanup/route.ts`
- Config: `.env.local` (add retention day variables)
- Schema: `/docs/schema.sql` (leads and events tables)
- Phase Context: `/docs/leadlocker_phase4_context.md`

