# Phase 4 Step 3: Testing Admin Error Alerts (SMS Monitoring)

## ✅ Implementation Complete

The admin error alert system has been created with:
- `/src/libs/notifyAdmin.ts` - SMS alert helper
- Updated `/src/app/api/cron/daily-summary/route.ts`
- Updated `/src/app/api/cron/cleanup/route.ts`

---

## 🔧 Environment Setup

### Required Environment Variables

Ensure these are in your `.env.local`:

```bash
# Required for SMS alerts
LL_DEFAULT_USER_PHONE=+393514421114

# Required for cron authentication
CRON_SECRET=your-secure-random-secret-here

# Twilio (should already be configured)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=+1234567890

# Supabase (should already be configured)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🧪 Local Testing

### Test 1: Trigger an Error in Daily Summary

**Method 1: Invalid Database Query**

Temporarily break the database query to trigger an error:

1. Open `/src/app/api/cron/daily-summary/route.ts`
2. Find line with `.from('leads')` (around line 48)
3. Change to `.from('nonexistent_table')`
4. Run the cron:

```bash
curl -X POST http://localhost:3000/api/cron/daily-summary \
  -H "x-cron-secret: your-secret-here"
```

**Expected Result:**
- Returns 500 error response
- SMS sent to `LL_DEFAULT_USER_PHONE`:
  ```
  ⚠️ LeadLocker Error
  Source: /api/cron/daily-summary
  Message: Database query failed: relation "public.nonexistent_table" does not exist
  Time: 2025-10-20T17:32:00.000Z
  ```
- New event in database with type `error.alert`

5. **Don't forget to revert the change!**

---

**Method 2: Simulate Twilio Failure**

1. Temporarily set invalid Twilio credentials in `.env.local`:
   ```bash
   TWILIO_AUTH_TOKEN=invalid_token
   ```

2. Run the cron:
   ```bash
   curl -X POST http://localhost:3000/api/cron/daily-summary \
     -H "x-cron-secret: your-secret"
   ```

3. **Revert the token** after testing

---

### Test 2: Trigger an Error in Cleanup

**Method: Break the Delete Query**

1. Open `/src/app/api/cron/cleanup/route.ts`
2. Find the delete query (around line 59)
3. Change `.in('status', ['COMPLETED'])` to `.in('status', ['INVALID_STATUS'])`
4. Run:

```bash
curl -X POST http://localhost:3000/api/cron/cleanup \
  -H "x-cron-secret: your-secret-here"
```

**Note:** This might not actually throw an error (it just won't delete anything). For a guaranteed error, change `.from('leads')` to `.from('invalid_table')`.

5. **Revert the change!**

---

### Test 3: Verify Database Event Logging

After triggering any error, check Supabase:

```sql
SELECT 
  event_type,
  created_at,
  metadata->>'source' as source,
  metadata->>'message' as message,
  metadata->>'error_type' as error_type,
  metadata
FROM events
WHERE event_type = 'error.alert'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Result:**
```
event_type  | source                    | message                           | created_at
------------|---------------------------|-----------------------------------|-------------------
error.alert | /api/cron/daily-summary   | Database query failed: ...        | 2025-10-20 17:32:00
error.alert | /api/cron/cleanup         | Failed to delete leads: ...       | 2025-10-20 03:15:00
```

---

### Test 4: Verify Silent Failure Behavior

**Test Case: Missing Admin Phone**

1. Temporarily remove `LL_DEFAULT_USER_PHONE` from `.env.local`
2. Trigger an error (using any method above)
3. Check logs for warning:
   ```
   [AdminAlert] LL_DEFAULT_USER_PHONE not configured - skipping SMS alert
   ```
4. Verify:
   - No SMS sent (obviously)
   - `error.alert` still logged to database
   - Endpoint still returns 500 error
   - No infinite error loop

5. **Restore `LL_DEFAULT_USER_PHONE`**

---

## 🚀 Production Testing

### Safely Test in Production

**Method: Use a Test Endpoint**

Create a temporary test route to trigger notifyAdmin:

```typescript
// src/app/api/test-alert/route.ts
import { NextResponse } from 'next/server';
import { notifyAdmin } from '@/libs/notifyAdmin';

export async function GET() {
  await notifyAdmin('/api/test-alert', new Error('Test error alert from production'));
  return NextResponse.json({ success: true, message: 'Test alert sent' });
}
```

Then call it:
```bash
curl https://your-app.vercel.app/api/test-alert
```

**Remember to delete this test route after verification!**

---

## 📊 SMS Alert Format

### What Admin Receives

```
⚠️ LeadLocker Error
Source: /api/cron/daily-summary
Message: Database query failed: relation "public.leads" does not exist
Time: 2025-10-20T17:32:15.482Z
```

**Character Limit:** ~160 chars for SMS  
**Error message truncated to:** 100 chars  
**Total alert:** ~135-150 chars typical

---

## 🔍 Event Metadata Structure

```json
{
  "event_type": "error.alert",
  "lead_id": null,
  "actor_id": "c96933ac-8a2b-484b-b9df-8e25d04e7f29",
  "metadata": {
    "source": "/api/cron/daily-summary",
    "message": "Database query failed: invalid input syntax",
    "timestamp": "2025-10-20T17:32:15.482Z",
    "error_type": "Error",
    "stack": "Error: Database query failed...\n  at handleDailySummaryCron..."
  }
}
```

**Stack Trace:** Limited to first 500 characters to avoid bloating the database.

---

## 🐛 Troubleshooting

### No SMS Received

**Check:**
1. `LL_DEFAULT_USER_PHONE` is set correctly (E.164 format: `+393514421114`)
2. Twilio credentials are valid
3. Twilio account has sufficient balance
4. Check Vercel logs for `[AdminAlert]` messages
5. Phone number is verified in Twilio (for trial accounts)

**Verify in logs:**
```
[AdminAlert] Failed to send SMS alert: <reason>
```

---

### No Database Event

**Check:**
1. Supabase service role key is valid
2. `events` table exists and is accessible
3. Check logs for:
   ```
   [AdminAlert] Failed to log error.alert event: <reason>
   ```

---

### Infinite Error Loops

**Protection Built-In:**

The `notifyAdmin` function is designed to fail silently:
- All operations wrapped in try/catch
- Never throws errors
- Logs to console only (doesn't call itself)
- Returns `void` (no error propagation)

If you see infinite loops, check that you're not calling `notifyAdmin` from within error handlers that are themselves monitored.

---

### Duplicate Alerts

**Expected Behavior:**
- One SMS per cron failure
- One `error.alert` event per failure

**If seeing duplicates:**
- Check if cron is configured to retry on failure
- Verify only one cron job is scheduled for each endpoint
- Check Vercel cron logs for duplicate executions

---

## 📈 Monitoring & Analytics

### Count Errors by Source

```sql
SELECT 
  metadata->>'source' as source,
  COUNT(*) as error_count,
  MAX(created_at) as last_error
FROM events
WHERE event_type = 'error.alert'
GROUP BY metadata->>'source'
ORDER BY error_count DESC;
```

### Recent Error Messages

```sql
SELECT 
  created_at,
  metadata->>'source' as source,
  metadata->>'message' as message,
  metadata->>'error_type' as type
FROM events
WHERE event_type = 'error.alert'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### Error Frequency Over Time

```sql
SELECT 
  DATE(created_at) as error_date,
  COUNT(*) as errors,
  COUNT(DISTINCT metadata->>'source') as affected_endpoints
FROM events
WHERE event_type = 'error.alert'
GROUP BY DATE(created_at)
ORDER BY error_date DESC
LIMIT 30;
```

---

## ✨ Success Criteria

- ✅ `notifyAdmin` helper created and exported
- ✅ Integrated into daily-summary cron route
- ✅ Integrated into cleanup cron route
- ✅ SMS sent to admin on errors
- ✅ `error.alert` events logged to database
- ✅ No infinite loops on failure
- ✅ Silent failure when SMS/DB unavailable
- ✅ Regular runs (no errors) stay silent
- ✅ No linter errors
- ⏳ Tested locally with triggered errors
- ⏳ Verified in production (optional test endpoint)

---

## 🔐 Security Notes

### Admin Phone Protection

- Never expose `LL_DEFAULT_USER_PHONE` in client-side code
- Keep in `.env.local` and Vercel environment variables only
- Consider using Vercel's encrypted environment variables

### Rate Limiting Considerations

If errors occur frequently:
- Twilio may rate-limit SMS sends
- Consider adding a debounce mechanism (e.g., max 1 SMS per hour per error source)
- Use Supabase to track last alert time

**Future Enhancement:**
```typescript
// Check if we've alerted in the last hour
const { data: recentAlerts } = await supabaseAdmin
  .from('events')
  .select('created_at')
  .eq('event_type', 'error.alert')
  .eq('metadata->source', errorSource)
  .gte('created_at', new Date(Date.now() - 3600000).toISOString());

if (recentAlerts && recentAlerts.length > 0) {
  // Skip SMS, only log to database
  return;
}
```

---

## 🎯 Next Steps

With Phase 4 Step 3 complete, you now have:
- ✅ Automated daily summaries (Step 1)
- ✅ Automated data cleanup (Step 2)
- ✅ Admin error alerts via SMS (Step 3)

**Remaining:**
- **Step 4:** Dashboard Activity Feed (real-time event display)

---

## 📚 Related Files

- Implementation: `/src/libs/notifyAdmin.ts`
- Daily Summary Cron: `/src/app/api/cron/daily-summary/route.ts`
- Cleanup Cron: `/src/app/api/cron/cleanup/route.ts`
- Phase Context: `/docs/leadlocker_phase4_context.md`
- Testing Guides:
  - Step 1: `/docs/phase4_step1_testing.md`
  - Step 2: `/docs/phase4_step2_testing.md`
  - Step 3: `/docs/phase4_step3_testing.md` (this file)

