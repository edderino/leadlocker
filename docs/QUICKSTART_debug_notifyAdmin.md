# Quick Start: Debug notifyAdmin

## 🚀 Fast Track Testing (3 Steps)

### Step 1: Check Environment Variables

```bash
curl http://localhost:3000/api/test/check-env
```

**Expected Output:**
```json
{
  "success": true,
  "summary": "✅ All environment variables configured correctly!"
}
```

**If you see issues:**
- Open `.env.local`
- Add any missing variables (see error list)
- Restart dev server: `npm run dev`
- Run Step 1 again

---

### Step 2: Test the Alert System

```bash
curl http://localhost:3000/api/test/notify-admin
```

**Watch your terminal for detailed logs.**

**Expected Response:**
```json
{
  "success": true,
  "message": "Test alert triggered. Check console logs, your phone, and the events table."
}
```

**In your terminal, you should see:**
```
========================================
TEST: Triggering notifyAdmin...
========================================

[notifyAdmin] ===== TRIGGERED =====
[notifyAdmin] Source: /api/test/notify-admin
[notifyAdmin] Error: This is a TEST error alert
[notifyAdmin] Admin phone configured: Yes (+393514421114)
[notifyAdmin] ✅ Database event logged successfully
[notifyAdmin] ✅ SMS sent successfully
[notifyAdmin] ===== COMPLETED =====

========================================
TEST: notifyAdmin call completed
========================================
```

**Also check:**
- ✅ SMS received on your phone
- ✅ New event in Supabase `events` table

---

### Step 3: Verify in Database

Run this in Supabase SQL Editor:

```sql
SELECT 
  event_type,
  created_at,
  metadata->>'source' as source,
  metadata->>'message' as message
FROM events
WHERE event_type = 'error.alert'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:** One row showing your test alert

---

## ✅ Success Checklist

- [ ] Environment check passes (`/api/test/check-env`)
- [ ] Console shows `[notifyAdmin] ===== COMPLETED =====`
- [ ] Console shows `[notifyAdmin] ✅ Database event logged successfully`
- [ ] Console shows `[Twilio] ✅ SMS sent successfully`
- [ ] SMS received on phone (`+393514421114`)
- [ ] Event appears in Supabase `events` table

---

## ❌ If Something Failed

### Issue: Environment check fails

**Run:**
```bash
curl http://localhost:3000/api/test/check-env | jq
```

**Look at the `issues` array and fix each one.**

Common fixes:
```bash
# Add to .env.local
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1234567890
LL_DEFAULT_USER_PHONE=+393514421114
```

Then restart: `npm run dev`

---

### Issue: Database event not logged

**Check terminal for:**
```
[notifyAdmin] ❌ Database insert failed: ...
```

**Common causes:**
1. Missing `events` table
2. Invalid `SUPABASE_SERVICE_ROLE_KEY`
3. RLS policy blocking insert

**Quick fix:**
```sql
-- Run in Supabase SQL Editor
SELECT * FROM events LIMIT 1;

-- If table doesn't exist, create it (see docs/schema.sql)
```

---

### Issue: SMS not sent

**Check terminal for:**
```
[Twilio] ❌ SMS send failed: ...
```

**Common causes:**

**A. Twilio not configured:**
```
[Twilio] ❌ SMS send failed: Twilio not configured. Missing: TWILIO_ACCOUNT_SID
```
**Fix:** Add missing env vars to `.env.local`

**B. Unverified phone (trial account):**
```
[Twilio] ❌ SMS send failed: The number +393514421114 is unverified
```
**Fix:** Verify the number at https://console.twilio.com/ or upgrade to paid account

**C. Invalid credentials:**
```
[Twilio] ❌ SMS send failed: Authenticate
[Twilio] Error code: 20003
```
**Fix:** Double-check `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`

**D. Invalid phone format:**
```
[Twilio] ❌ SMS send failed: The 'To' number 393514421114 is not a valid phone number
```
**Fix:** Use E.164 format with `+`: `+393514421114`

---

## 🧹 Clean Up After Testing

Once everything works, **delete the test endpoints**:

```bash
rm src/app/api/test/notify-admin/route.ts
rm src/app/api/test/check-env/route.ts
```

These are for debugging only and should NOT be deployed to production!

---

## 📖 Full Debug Guide

For detailed troubleshooting, see:
- `/docs/DEBUG_notifyAdmin.md` - Comprehensive debugging guide
- `/docs/phase4_step3_testing.md` - Full testing documentation

---

## 🎯 Next: Test with Real Error

Now that `notifyAdmin` is working, test it with a real cron failure:

```bash
# 1. Temporarily break cleanup route
# In src/app/api/cron/cleanup/route.ts
# Change: .from('leads')
# To:     .from('nonexistent_table')

# 2. Trigger the error
curl -X POST http://localhost:3000/api/cron/cleanup \
  -H "x-cron-secret: test-secret-12345"

# 3. Verify alert received

# 4. REVERT the change!
```

---

## 🚀 Production Deployment

Once verified locally:

1. **Clean up test files**
   ```bash
   rm src/app/api/test/notify-admin/route.ts
   rm src/app/api/test/check-env/route.ts
   ```

2. **Commit and push**
   ```bash
   git add .
   git commit -m "Fix: Add detailed logging to notifyAdmin"
   git push
   ```

3. **Verify env vars in Vercel**
   - All Twilio variables
   - `LL_DEFAULT_USER_PHONE`
   - Supabase variables

4. **Monitor Vercel logs** for `[notifyAdmin]` messages

---

## 💡 Pro Tips

1. **Keep logging during initial rollout** - helps catch issues early
2. **Monitor the `events` table** - check for `error.alert` entries regularly
3. **Set up a weekly query** to review errors:
   ```sql
   SELECT COUNT(*), metadata->>'source' 
   FROM events 
   WHERE event_type = 'error.alert' 
     AND created_at > NOW() - INTERVAL '7 days'
   GROUP BY metadata->>'source';
   ```

---

## ✨ Expected Result

When working correctly:

**Terminal:**
```
[notifyAdmin] ===== TRIGGERED =====
[notifyAdmin] ✅ Database event logged successfully
[Twilio] ✅ SMS sent successfully. SID: SMxxxxx
[notifyAdmin] ✅ SMS sent successfully
[notifyAdmin] ===== COMPLETED =====
```

**Phone:**
```
⚠️ LeadLocker Error
Source: /api/test/notify-admin
Message: This is a TEST error alert from /api/test/notify-admin
Time: 2025-10-20T18:45:32Z
```

**Database:**
```
event_type  | created_at | source                  | message
------------|------------|-------------------------|------------------
error.alert | just now   | /api/test/notify-admin  | This is a TEST...
```

🎉 **You're all set!**

