# 🔔 Quick Test Guide - Push Notifications

## ✅ Current Status

- ✅ **'use client' directive**: Present in NotificationManager.tsx
- ✅ **PWARegistration**: Mounted in layout.tsx
- ✅ **VAPID keys**: Configured and loaded
- ✅ **Production server**: Running on http://localhost:3000
- ✅ **Configuration verified**: `curl` confirms VAPID is `true`

---

## 🚀 3-Step Test (Do This Now!)

### Step 1: Open Browser

**Navigate to:**
```
http://localhost:3000/client/demo-org
```

**Expected:**
- You'll see "Access Required" screen (need invite)

---

### Step 2: Generate Invite & Access

**In Terminal:**
```bash
curl -X POST http://localhost:3000/api/client/invite \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: test-secret-12345" \
  -d '{"orgId":"demo-org","phone":"+393514421114"}'
```

**Copy the `inviteUrl` from response and open it in browser**

**Expected:**
- Redirects to `/client/demo-org`
- You see the **Client Dashboard**
- **NEW:** Push Notifications card appears! 🎉

**The card should show:**
```
🔔 Push Notifications
Get notified about new leads and updates

What you'll receive: Instant notifications when new leads
arrive, status changes, and daily summaries.

[Enable] ← Blue button
```

---

### Step 3: Enable & Test

**A. Click "Enable" button**

**Expected Browser Prompt:**
```
localhost wants to
Show notifications

[Block]  [Allow]
```

**B. Click "Allow"**

**Expected Result:**
- ✅ Status changes to: "✓ Enabled - You'll receive updates" (green text)
- ✅ Button changes to red "Disable"
- ✅ Toast appears: "✅ Notifications enabled!"

**Console should show:**
```
[PWA] Service Worker registered successfully: /
[NotificationManager] Starting subscription...
[NotificationManager] Permission granted
[NotificationManager] Service worker ready
[NotificationManager] Browser subscription created
[NotificationManager] Subscription saved to backend
```

**C. Trigger Test Notification**

**In Terminal:**
```bash
curl -X POST http://localhost:3000/api/notifications/trigger \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: test-secret-12345" \
  -d '{
    "orgId": "demo-org",
    "eventType": "test.notification",
    "title": "🎉 Success!",
    "message": "Push notifications are working perfectly!",
    "url": "/client/demo-org"
  }'
```

**Expected Terminal:**
```json
{"success":true,"sent":1,"failed":0,"total":1,"cleaned":0,"message":"Sent 1 notification(s), 0 failed"}
```

**Expected Browser:**
- 🔔 **Native notification popup** appears with:
  - Title: "🎉 Success!"
  - Message: "Push notifications are working perfectly!"
  - Click it → Opens/focuses the client dashboard

---

## 🐛 Troubleshooting

### Issue: Don't see Push Notifications card

**Check:**
1. Server is running in **production mode**: `npm run start` (NOT `npm run dev`)
2. View page source - look for `<script>` tag with NotificationManager

**Fix:**
```bash
# Kill dev server if running
lsof -ti:3000 | xargs kill -9

# Start production
cd /Users/adrianmorosin/leadlocker
npm run start
```

---

### Issue: "Block" is grayed out / permission already denied

**Chrome Fix:**
```
1. Go to: chrome://settings/content/notifications
2. Find "localhost:3000" in Blocked list
3. Click trash icon to remove
4. Reload page and try again
```

**Safari Fix:**
```
Safari → Settings → Websites → Notifications
Remove localhost from Deny list
```

---

### Issue: Button doesn't click / nothing happens

**Check DevTools Console:**
- Look for JavaScript errors
- Verify `'use client'` is in NotificationManager.tsx
- Check service worker status: DevTools → Application → Service Workers

---

### Issue: Notification doesn't appear

**After clicking Enable, check:**

1. **Permission granted?**
   ```javascript
   // In browser console:
   Notification.permission
   // Should return: "granted"
   ```

2. **Service worker active?**
   - DevTools → Application → Service Workers
   - Status should be: "activated and is running"

3. **Do Not Disturb mode?**
   - Mac: System Settings → Notifications → Focus
   - Windows: Settings → Notifications
   - Make sure "Do Not Disturb" is OFF

4. **Browser notifications enabled?**
   - Mac: System Settings → Notifications → Chrome/Safari → Allow
   - Windows: Settings → Notifications → Chrome → On

---

## 📊 Verify Database

After clicking "Enable", check Supabase:

```sql
SELECT id, org_id, LEFT(endpoint, 50) as endpoint, created_at
FROM push_subscriptions
WHERE org_id = 'demo-org'
ORDER BY created_at DESC;
```

**Expected:** 1 row with FCM endpoint

---

## 🎯 Success Criteria

- [x] Production server running
- [x] VAPID keys configured
- [x] NotificationManager visible
- [ ] Permission prompt appears
- [ ] Subscription saved to database
- [ ] Test notification appears
- [ ] Click notification opens app

---

## 📝 Quick Commands

**Check server status:**
```bash
curl -s http://localhost:3000/api/notifications/trigger \
  -H "x-cron-secret: test-secret-12345" | jq .
```

**Kill and restart:**
```bash
lsof -ti:3000 | xargs kill -9 && cd /Users/adrianmorosin/leadlocker && npm run start
```

**View server logs:**
```bash
tail -f /tmp/prod-server.log
```

---

🎉 **Ready to test!** Open http://localhost:3000/client/demo-org

