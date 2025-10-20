# Debug Guide: notifyAdmin Not Triggering

## ✅ Updates Applied

The following files have been enhanced with detailed logging:

1. `/src/libs/notifyAdmin.ts` - Added step-by-step console logs
2. `/src/libs/twilio.ts` - Added detailed SMS send logging

---

## 🧪 Testing Steps

### Step 1: Verify Environment Variables

Check your `.env.local` file contains ALL of these:

```bash
# Twilio (required for SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM_NUMBER=+1234567890

# Admin phone (required for alerts)
LL_DEFAULT_USER_PHONE=+393514421114

# Supabase (required for event logging)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cron secret (for testing)
CRON_SECRET=test-secret-12345
```

**Common Issues:**
- Missing `+` in phone numbers (must be E.164 format)
- Extra spaces around values
- Quotes around values (usually not needed)

---

### Step 2: Trigger a Test Error

**Method A: Temporarily Break the Cleanup Route**

1. Open `/src/app/api/cron/cleanup/route.ts`
2. Find line ~59: `.from('leads')`
3. Change to: `.from('nonexistent_table')`
4. Save the file

**Method B: Break the Database Query**

1. Same file, find line ~63: `.in('status', ['COMPLETED'])`
2. Change to: `.in('invalid_column', ['test'])`
3. Save the file

---

### Step 3: Run the Test

```bash
curl -X POST http://localhost:3000/api/cron/cleanup \
  -H "x-cron-secret: test-secret-12345"
```

---

### Step 4: Analyze the Console Output

You should see detailed logs like this:

#### ✅ Expected Success Output:

```
[Cleanup] Cleanup job failed: <some error>
[notifyAdmin] ===== TRIGGERED =====
[notifyAdmin] Source: /api/cron/cleanup
[notifyAdmin] Error: Failed to delete leads: ...
[notifyAdmin] Admin phone configured: Yes (+393514421114)
[notifyAdmin] Timestamp: 2025-10-20T17:32:15.482Z

[notifyAdmin] Step 1: Attempting to log error.alert event to database...
[notifyAdmin] ✅ Database event logged successfully

[notifyAdmin] Step 2: Attempting to send SMS alert...
[notifyAdmin] SMS body prepared (length: 123)
[notifyAdmin] Sending SMS to: +393514421114

[Twilio] Attempting to send SMS...
[Twilio] To: +393514421114
[Twilio] Body length: 123
[Twilio] From number: +1234567890
[Twilio] Client initialized: Yes
[Twilio] TWILIO_ACCOUNT_SID: Set
[Twilio] TWILIO_AUTH_TOKEN: Set
[Twilio] Calling Twilio API...
[Twilio] ✅ SMS sent successfully. SID: SMxxxxxxxxxxxxx

[notifyAdmin] ✅ SMS sent successfully: { sid: 'SMxxxxx', ... }
[notifyAdmin] ===== COMPLETED =====
```

---

## 🔍 Troubleshooting Common Issues

### Issue 1: notifyAdmin Never Called

**Symptoms:**
```
[Cleanup] Cleanup job failed: <error>
```
But NO `[notifyAdmin]` logs appear.

**Possible Causes:**
1. The error is NOT being caught (shouldn't happen)
2. The catch block is not executing

**Fix:**
Check that the cleanup route has:
```typescript
} catch (error: any) {
  console.error('[Cleanup] Cleanup job failed:', error);
  await notifyAdmin('/api/cron/cleanup', error);  // ← This line
  return NextResponse.json(...)
}
```

---

### Issue 2: Database Insert Failing

**Symptoms:**
```
[notifyAdmin] Step 1: Attempting to log error.alert event to database...
[notifyAdmin] ❌ Database insert failed: { message: '...' }
```

**Common Causes:**

1. **Missing `events` table:**
   ```sql
   -- Run this in Supabase SQL Editor to check:
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_name = 'events'
   );
   ```

2. **Invalid service role key:**
   - Verify `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
   - Check it matches your Supabase project

3. **RLS policy blocking insert:**
   ```sql
   -- Check if service role can insert:
   SELECT * FROM events LIMIT 1;
   
   -- If needed, grant access:
   ALTER TABLE events ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Service role can insert events"
   ON events FOR INSERT
   TO service_role
   USING (true);
   ```

4. **Missing columns:**
   ```sql
   -- Verify events table structure:
   \d events
   
   -- Should have: event_type, lead_id, actor_id, metadata, created_at
   ```

---

### Issue 3: SMS Not Sending

**Symptoms:**
```
[notifyAdmin] Step 2: Attempting to send SMS alert...
[Twilio] Attempting to send SMS...
[Twilio] ❌ SMS send failed: Twilio not configured. Missing: TWILIO_ACCOUNT_SID
```

**Fix:**
Add missing environment variables to `.env.local`

---

**Symptoms:**
```
[Twilio] ❌ SMS send failed: The number +393514421114 is unverified...
```

**Fix:**
For Twilio **trial accounts**:
1. Go to https://console.twilio.com/
2. Navigate to Phone Numbers → Verified Caller IDs
3. Add and verify `+393514421114`

**OR** upgrade to a paid Twilio account.

---

**Symptoms:**
```
[Twilio] ❌ SMS send failed: Authenticate
[Twilio] Error code: 20003
[Twilio] HTTP status: 401
```

**Fix:**
Invalid Twilio credentials. Double-check:
- `TWILIO_ACCOUNT_SID` (starts with `AC`)
- `TWILIO_AUTH_TOKEN`

Get correct values from: https://console.twilio.com/

---

### Issue 4: Phone Number Format

**Symptoms:**
```
[Twilio] ❌ SMS send failed: The 'To' number 393514421114 is not a valid phone number
```

**Fix:**
Phone numbers MUST be in E.164 format (include `+` and country code):
- ✅ Correct: `+393514421114`
- ❌ Wrong: `393514421114`
- ❌ Wrong: `3514421114`

---

### Issue 5: Admin Phone Not Configured

**Symptoms:**
```
[notifyAdmin] Admin phone configured: No
[notifyAdmin] ⚠️ LL_DEFAULT_USER_PHONE not configured - skipping SMS alert
```

**Fix:**
Add to `.env.local`:
```bash
LL_DEFAULT_USER_PHONE=+393514421114
```

Then **restart the dev server**:
```bash
# Stop the server (Ctrl+C)
npm run dev
```

---

## 📊 Verification Checklist

After running the test, verify:

### 1. Console Logs Show Success
- [ ] `[notifyAdmin] ===== TRIGGERED =====`
- [ ] `[notifyAdmin] ✅ Database event logged successfully`
- [ ] `[Twilio] ✅ SMS sent successfully. SID: ...`
- [ ] `[notifyAdmin] ===== COMPLETED =====`

### 2. Database Event Created
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

**Expected:** One row with your test error

### 3. SMS Received on Phone
- [ ] SMS received on `+393514421114`
- [ ] Contains error source and message
- [ ] Timestamp is recent

---

## 🔄 After Testing

**IMPORTANT:** Revert your test changes!

If you changed:
```typescript
.from('nonexistent_table')
```

Change back to:
```typescript
.from('leads')
```

Then save and restart dev server.

---

## 🎯 Quick Diagnostic Command

Run this in your terminal (with dev server running):

```bash
curl -X POST http://localhost:3000/api/cron/cleanup \
  -H "x-cron-secret: test-secret-12345" \
  2>&1 | grep -E "\[notifyAdmin\]|\[Twilio\]"
```

This will show ONLY the `notifyAdmin` and `Twilio` logs.

---

## 📈 What Success Looks Like

### Console Output:
```
[Cleanup] Cleanup job failed: relation "public.nonexistent_table" does not exist
[notifyAdmin] ===== TRIGGERED =====
[notifyAdmin] Source: /api/cron/cleanup
[notifyAdmin] Error: Failed to delete leads: relation "public.nonexistent_table" does not exist
[notifyAdmin] Admin phone configured: Yes (+393514421114)
[notifyAdmin] Timestamp: 2025-10-20T18:45:32.123Z
[notifyAdmin] Step 1: Attempting to log error.alert event to database...
[notifyAdmin] ✅ Database event logged successfully
[notifyAdmin] Step 2: Attempting to send SMS alert...
[notifyAdmin] SMS body prepared (length: 145)
[notifyAdmin] Sending SMS to: +393514421114
[Twilio] Attempting to send SMS...
[Twilio] To: +393514421114
[Twilio] Body length: 145
[Twilio] From number: +15551234567
[Twilio] Client initialized: Yes
[Twilio] TWILIO_ACCOUNT_SID: Set
[Twilio] TWILIO_AUTH_TOKEN: Set
[Twilio] Calling Twilio API...
[Twilio] ✅ SMS sent successfully. SID: SM1234567890abcdef
[notifyAdmin] ✅ SMS sent successfully: MessageInstance
[notifyAdmin] ===== COMPLETED =====
```

### Database Query Result:
```
 event_type  |       created_at        |       source        |                    message                    
-------------|-------------------------|---------------------|-----------------------------------------------
 error.alert | 2025-10-20 18:45:32.123 | /api/cron/cleanup   | Failed to delete leads: relation does not exist
```

### Phone:
```
⚠️ LeadLocker Error
Source: /api/cron/cleanup
Message: Failed to delete leads: relation "public.nonexistent_table" does not exist
Time: 2025-10-20T18:45:32.123Z
```

---

## 🛠️ Still Not Working?

If you're still having issues:

1. **Copy the FULL console output** and share it
2. **Share your `.env.local`** (redact sensitive values):
   ```bash
   TWILIO_ACCOUNT_SID=AC... (first 4 chars)
   TWILIO_AUTH_TOKEN=*** (redacted)
   TWILIO_FROM_NUMBER=+1... (format only)
   LL_DEFAULT_USER_PHONE=+39... (format only)
   ```
3. **Check Supabase logs** in dashboard for any errors
4. **Check Twilio logs** at https://console.twilio.com/monitor/logs/messages

---

## 📝 Next Steps After Fix

Once `notifyAdmin` is working:

1. **Remove the test breakage** (revert to original code)
2. **Optional: Reduce logging verbosity** (comment out some console.logs)
3. **Test in production** with a real error scenario
4. **Monitor** the `events` table for `error.alert` entries

---

## 🎉 Confirmation Message

When everything works, you should see:

```
✅ Database event logged successfully
✅ SMS sent successfully
```

Plus receive an SMS on your phone!

