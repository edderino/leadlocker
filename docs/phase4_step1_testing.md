# Phase 4 Step 1: Testing the Daily Summary Cron

## ✅ Implementation Complete

The cron endpoint has been created at `/src/app/api/cron/daily-summary/route.ts`.

---

## 🔧 Environment Setup

### Required Environment Variable

Add this to your `.env.local` file:

```bash
CRON_SECRET=your-secure-random-secret-here
```

**Generate a secure secret:**
```bash
# On macOS/Linux:
openssl rand -hex 32

# Or use Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### For Vercel Production

Add the same `CRON_SECRET` in your Vercel dashboard:
1. Go to your project → Settings → Environment Variables
2. Add: `CRON_SECRET` with your secure value
3. Deploy to apply the changes

---

## 🧪 Local Testing

### Test 1: Without Authorization (Should Fail)

```bash
curl http://localhost:3000/api/cron/daily-summary
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
curl -X POST http://localhost:3000/api/cron/daily-summary \
  -H "x-cron-secret: your-secure-random-secret-here"
```

**Expected Response:**
```json
{
  "success": true,
  "total": 5,
  "byStatus": {
    "NEW": 3,
    "APPROVED": 1,
    "COMPLETED": 1
  },
  "timestamp": "2025-10-20T07:00:00.000Z"
}
```

**Also expect:**
- SMS sent to `LL_DEFAULT_USER_PHONE`
- Two events logged in database:
  - `summary.sent` 
  - `sms.sent`

---

### Test 3: Verify Events in Database

Run this query in Supabase SQL Editor:

```sql
SELECT 
  event_type,
  created_at,
  metadata
FROM events
WHERE event_type IN ('summary.sent', 'sms.sent')
  AND metadata->>'triggered_by' = 'cron'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🚀 Production Setup (Vercel Cron)

### Option 1: Vercel Dashboard (Recommended)

1. Go to your Vercel project
2. Navigate to: **Settings → Cron Jobs**
3. Click **Add Cron Job**
4. Configure:
   - **Path:** `/api/cron/daily-summary`
   - **Schedule:** `0 17 * * *` (5:00 PM UTC daily)
   - **Custom Headers:**
     ```
     x-cron-secret: your-secure-random-secret-here
     ```
5. Save

**Note:** Adjust the schedule based on your timezone. For example:
- `0 17 * * *` = 5:00 PM UTC
- `0 9 * * *` = 9:00 AM UTC (6:00 PM AEST during standard time)

### Option 2: Using vercel.json (Alternative)

Update `vercel.json` to use the new endpoint:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-summary",
      "schedule": "0 17 * * *"
    }
  ]
}
```

**Note:** This method does NOT allow custom headers. You would need to modify the route to also accept Vercel's built-in authentication headers (`x-vercel-cron-id`, etc.) or use environment-based auth.

---

## 🔍 Monitoring & Verification

### Check Logs

After cron runs, check Vercel logs:
1. Go to Vercel Dashboard → Your Project
2. Click **Logs**
3. Filter by `/api/cron/daily-summary`
4. Look for:
   - `[Cron] Starting daily summary job`
   - `[Cron] Summary generated`
   - `[Cron] SMS sent successfully`
   - `[Cron] Daily summary job completed successfully`

### Verify SMS Delivery

Check your phone for the SMS at the scheduled time:
```
Leads today: 5 (new 3, ok 1, done 1)
```

### Verify Database Events

Check the `events` table for new entries after each cron run.

---

## 🐛 Troubleshooting

### "Unauthorized" Error
- Verify `CRON_SECRET` is set in environment variables
- Ensure the header name is exactly: `x-cron-secret`
- Check that the secret value matches exactly (no extra spaces)

### "Recipient phone number not configured"
- Verify `LL_DEFAULT_USER_PHONE` is set
- Use E.164 format: `+1234567890`

### "SMS delivery failed"
- Check Twilio credentials are valid
- Verify Twilio account has sufficient balance
- Check Twilio console for error messages

### Events Not Logging
- Check Supabase connection
- Verify `events` table exists
- Check service role key permissions
- Look for console errors in logs

---

## ✨ Success Criteria

- ✅ Cron endpoint created with CRON_SECRET auth
- ✅ Queries leads from "today"
- ✅ Sends SMS summary via Twilio
- ✅ Logs `summary.sent` event
- ✅ Logs `sms.sent` event
- ✅ Returns JSON success response
- ✅ Handles errors gracefully
- ⏳ Configure in Vercel (manual step)
- ⏳ Verify SMS received at scheduled time

