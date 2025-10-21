# 🔔 Push Notification Verification Guide
**Phase 6 Step 2 - NotificationManager Integration**

---

## ✅ Step 1: Integration Complete

The NotificationManager component is now integrated into `/client/[orgId]/page.tsx`.

**Server Status:** Running on `http://localhost:3000`

---

## 🧪 Step 2: Browser Subscription Test

### 2.1 Generate Client Access (if needed)

If you don't have a valid session cookie, generate an invite:

```bash
curl -X POST http://localhost:3000/api/client/invite \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: test-secret-12345" \
  -d '{
    "orgId": "demo-org",
    "phone": "+393514421114"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "inviteUrl": "http://localhost:3000/client/access?token=..."
}
```

**Action:** Open the `inviteUrl` in your browser to set the session cookie.

---

### 2.2 Access Client Portal

Navigate to:
```
http://localhost:3000/client/demo-org
```

**Expected UI:**
- ✅ "Client Dashboard" heading
- ✅ **Push Notifications** card visible (NEW!)
- ✅ Status shows: "Get notified about new leads..."
- ✅ Blue "Enable" button

---

### 2.3 Enable Notifications

**Action:** Click the **"Enable"** button

**Expected Flow:**

1. **Browser Permission Prompt Appears:**
   ```
   localhost wants to
   Show notifications
   [ Block ] [ Allow ]
   ```

2. **Click "Allow"**

3. **UI Updates:**
   - ✅ Status changes to: "✓ Enabled - You'll receive updates" (green)
   - ✅ Button changes to red "Disable"
   - ✅ Toast appears: "✅ Notifications enabled!"

4. **Console Logs:**
   ```
   [NotificationManager] Starting subscription...
   [NotificationManager] Permission granted
   [NotificationManager] Service worker ready
   [NotificationManager] Browser subscription created
   [NotificationManager] Subscription saved to backend
   ```

---

## 🗄️ Step 3: Database Verification

### 3.1 Check Subscription Storage

**In Supabase SQL Editor, run:**

```sql
SELECT 
  id, 
  org_id, 
  LEFT(endpoint, 50) as endpoint_preview,
  created_at
FROM push_subscriptions
WHERE org_id = 'demo-org'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Result:**
```
id                                   | org_id   | endpoint_preview                           | created_at
-------------------------------------|----------|--------------------------------------------|--------------------------
550e8400-e29b-41d4-a716-446655440000 | demo-org | https://fcm.googleapis.com/fcm/send/...    | 2025-10-21 17:30:00+00
```

✅ **Success:** Row exists with your `demo-org` and FCM endpoint

---

### 3.2 Check Event Logging

```sql
SELECT 
  event_type, 
  org_id,
  metadata,
  created_at
FROM events
WHERE event_type = 'push.subscribed'
  AND org_id = 'demo-org'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
```json
{
  "event_type": "push.subscribed",
  "org_id": "demo-org",
  "metadata": {
    "subscription_id": "550e8400-...",
    "endpoint_preview": "https://fcm.googleapis.com...",
    "action": "new"
  },
  "created_at": "2025-10-21T17:30:00.000Z"
}
```

---

## 🚀 Step 4: Trigger Test Notification

### 4.1 Send Test Push

**In Terminal:**

```bash
curl -X POST http://localhost:3000/api/notifications/trigger \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: test-secret-12345" \
  -d '{
    "orgId": "demo-org",
    "eventType": "system.test",
    "title": "🔔 LeadLocker Test Notification",
    "message": "If you see this popup, push notifications are live!",
    "url": "/client/demo-org"
  }'
```

**Expected Terminal Response:**
```json
{
  "success": true,
  "sent": 1,
  "failed": 0,
  "total": 1,
  "cleaned": 0,
  "message": "Sent 1 notification(s), 0 failed"
}
```

---

### 4.2 Browser Notification

**Expected in Browser:**

1. **System Notification Appears:**
   - **Title:** 🔔 LeadLocker Test Notification
   - **Body:** If you see this popup, push notifications are live!
   - **Icon:** LeadLocker icon (if configured)
   - **Actions:** "View" and "Dismiss" buttons

2. **Service Worker Console Logs:**
   ```
   [SW] Push notification received
   [SW] Push data: {...}
   ```

3. **Click Notification:**
   - ✅ Opens/focuses browser tab
   - ✅ Navigates to `/client/demo-org`
   - ✅ Notification closes

---

## 📊 Step 5: Verify Audit Trail

### 5.1 Check Push Event Logs

**In Supabase SQL Editor:**

```sql
SELECT 
  event_type,
  org_id,
  metadata,
  created_at
FROM events
WHERE event_type LIKE 'push.%'
  AND org_id = 'demo-org'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Events:**

| event_type        | org_id   | metadata                          | created_at           |
|-------------------|----------|-----------------------------------|----------------------|
| push.sent         | demo-org | {sent: 1, failed: 0, title: ...}  | 2025-10-21 17:35:00 |
| push.subscribed   | demo-org | {subscription_id: ..., action...} | 2025-10-21 17:30:00 |

---

## 🧪 Step 6: Advanced Tests

### 6.1 Test Unsubscribe

**Action:** Click "Disable" button in NotificationManager

**Expected:**
- ✅ Status: "Get notified about new leads..."
- ✅ Button: "Enable" (blue)
- ✅ Toast: "🔕 Notifications disabled"

**Database Check:**
```sql
SELECT COUNT(*) as subscription_count
FROM push_subscriptions
WHERE org_id = 'demo-org';
```

**Expected:** `subscription_count = 0` (subscription removed)

**Events Check:**
```sql
SELECT event_type, created_at
FROM events
WHERE event_type = 'push.unsubscribed'
  AND org_id = 'demo-org'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:** Recent `push.unsubscribed` event logged

---

### 6.2 Test Multiple Subscriptions

**Action:** Subscribe from a different browser (Chrome, Firefox, Safari)

**Expected:**
```sql
SELECT id, org_id, LEFT(endpoint, 30) as preview
FROM push_subscriptions
WHERE org_id = 'demo-org';
```

**Result:** Multiple rows with different endpoints

**Trigger Test:**
```bash
curl -X POST http://localhost:3000/api/notifications/trigger \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: test-secret-12345" \
  -d '{
    "orgId": "demo-org",
    "eventType": "multi.test",
    "title": "Multi-Device Test",
    "message": "This should appear on all subscribed browsers"
  }'
```

**Expected:** `"sent": 2` (or number of active subscriptions)  
**Browser:** Notification appears on ALL subscribed browsers

---

### 6.3 Test Org Isolation

**Create second org subscription:**

```bash
# Generate invite for second org
curl -X POST http://localhost:3000/api/client/invite \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: test-secret-12345" \
  -d '{
    "orgId": "acme-corp",
    "phone": "+393514421114"
  }'

# Accept invite, enable notifications for acme-corp
```

**Trigger for demo-org only:**
```bash
curl -X POST http://localhost:3000/api/notifications/trigger \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: test-secret-12345" \
  -d '{
    "orgId": "demo-org",
    "title": "Demo Org Only",
    "message": "This should NOT go to acme-corp"
  }'
```

**Expected:**
- ✅ `demo-org` receives notification
- ✅ `acme-corp` does NOT receive notification
- ✅ Response: `"sent": 1` (only demo-org count)

---

## ✅ Success Criteria Checklist

- [ ] NotificationManager visible in client portal
- [ ] Permission request shown and handled correctly
- [ ] Subscription stored in `push_subscriptions` table
- [ ] `push.subscribed` event logged
- [ ] Push trigger returns `{"success": true, "sent": 1}`
- [ ] Browser notification appears
- [ ] Click notification opens/focuses app
- [ ] `push.sent` event logged
- [ ] Unsubscribe removes database row
- [ ] `push.unsubscribed` event logged
- [ ] Multi-device subscriptions work
- [ ] Org isolation maintained (no cross-org notifications)

---

## 🐛 Troubleshooting

### Issue: "Permission denied"

**Fix:** Reset browser permissions:
- Chrome: Settings → Privacy → Site Settings → Notifications → Remove localhost
- Reload page and try again

---

### Issue: "Service worker not ready"

**Fix:** 
1. Check DevTools → Application → Service Workers
2. Ensure status is "Activated and running"
3. If not, reload page

---

### Issue: "Push notifications not configured"

**Verify VAPID keys:**
```bash
curl -s -X GET http://localhost:3000/api/notifications/trigger \
  -H "x-cron-secret: test-secret-12345" | jq .
```

**Expected:** `"configured": true`

If false, check `.env.local` has all 4 VAPID variables.

---

### Issue: "Table 'push_subscriptions' not found"

**Fix:** Run database migration:
```sql
-- Execute: /docs/migrations/phase6_push_subscriptions.sql
```

---

### Issue: Notification doesn't appear

**Checks:**
1. Browser Do Not Disturb off
2. OS notification settings allow localhost
3. Service worker console for errors
4. Check `push.sent` event was logged

---

## 🎉 Completion

Once all success criteria are met, you have a fully functional push notification system!

**Next Steps:**
- Integrate push triggers into lead creation (`/api/leads/new`)
- Add push to daily summary cron
- Customize notification preferences
- Add rich notifications with images
- Implement notification action buttons

**Documentation:**
- Full testing guide: `/docs/phase6_step2_testing.md`
- Migration script: `/docs/migrations/phase6_push_subscriptions.sql`

---

**Status:** Phase 6 Step 2 - Push Notifications ✅ COMPLETE

