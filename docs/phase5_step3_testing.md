# Phase 5 Step 3: Testing Client Invite Links

## ✅ Implementation Complete

The invite system has been created with:
- HMAC-signed, time-limited invite tokens
- SMS delivery via Twilio
- Cookie-based session management
- Access gating with friendly error messages
- Event logging for invites sent and accepted

---

## 📁 Files Created

1. **`/src/libs/signing.ts`** - HMAC token utilities (95 lines)
2. **`/src/app/api/client/invite/route.ts`** - Invite generation API (134 lines)
3. **`/src/app/client/access/route.ts`** - Token validation & cookie setter (97 lines)
4. **Updated `/src/app/client/[orgId]/page.tsx`** - Added cookie-based gating

---

## 🔧 Environment Setup

### Required Environment Variables

Add to your `.env.local`:

```bash
# Already set from previous steps
CLIENT_PORTAL_SECRET=your-random-hex-here
CRON_SECRET=test-secret-12345

# New for Step 3
NEXT_PUBLIC_BASE_URL=http://localhost:3000
REQUIRE_CLIENT_INVITE=true

# Already configured (for SMS)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1234567890
```

**Generate CLIENT_PORTAL_SECRET if not set:**
```bash
openssl rand -hex 32
```

---

## 🧪 Testing Steps

### Test 1: Generate Invite (API)

**Create an invite:**
```bash
curl -X POST http://localhost:3000/api/client/invite \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: test-secret-12345" \
  -d '{
    "orgId": "demo-org",
    "phone": "+393514421114",
    "ttlHours": 24
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "link": "http://localhost:3000/client/access?token=eyJvcmdJZCI6ImRlbW8tb3JnIiwiZXhwIjoxNzI5NTI...",
  "orgId": "demo-org",
  "expiresIn": "24 hours"
}
```

**Also check:**
- ✅ SMS sent to `+393514421114`
- ✅ SMS body: "LeadLocker access: [link] (expires in 24h)"
- ✅ Event logged in database (`invite.sent`)

---

### Test 2: Invalid Authentication (Should Fail)

**Without admin secret:**
```bash
curl -X POST http://localhost:3000/api/client/invite \
  -H "Content-Type: application/json" \
  -d '{"orgId": "demo-org", "phone": "+15551234567"}'
```

**Expected:** `401 Unauthorized`

---

**With invalid secret:**
```bash
curl -X POST http://localhost:3000/api/client/invite \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: wrong-secret" \
  -d '{"orgId": "demo-org", "phone": "+15551234567"}'
```

**Expected:** `401 Unauthorized`

---

### Test 3: Invalid Request Body (Should Fail)

**Missing orgId:**
```bash
curl -X POST http://localhost:3000/api/client/invite \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: test-secret-12345" \
  -d '{"phone": "+15551234567"}'
```

**Expected:** `400 Bad Request` with validation errors

---

**Invalid phone format:**
```bash
curl -X POST http://localhost:3000/api/client/invite \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: test-secret-12345" \
  -d '{"orgId": "demo-org", "phone": "1234567890"}'
```

**Expected:** `400 Bad Request` - "Phone must be in E.164 format"

---

### Test 4: Use Invite Link (Accept Invite)

1. **Generate an invite** (from Test 1)

2. **Copy the link** from the response

3. **Open in a private/incognito browser window:**
   ```
   http://localhost:3000/client/access?token=eyJvcmdJZCI6...
   ```

4. **Expected behavior:**
   - ✅ Page redirects to `/client/demo-org`
   - ✅ Dashboard loads successfully
   - ✅ Cookie `ll_client_org=demo-org` is set (check browser DevTools)
   - ✅ Event logged in database (`invite.accepted`)

5. **Verify cookie in browser:**
   - Open DevTools → Application → Cookies
   - Should see: `ll_client_org` = `demo-org`
   - Max-Age: 604800 (7 days)
   - HttpOnly: true
   - SameSite: Lax

---

### Test 5: Access Without Cookie (Should Block)

**With `REQUIRE_CLIENT_INVITE=true`:**

1. **Open a fresh private window** (no cookies)

2. **Navigate directly to:**
   ```
   http://localhost:3000/client/demo-org
   ```

3. **Expected to see:**
   - ✅ "Access Required" page with lock icon
   - ✅ Message: "You need an invite link..."
   - ✅ Organization ID displayed
   - ✅ No access to dashboard
   - ✅ Friendly error UI (not a 401 error page)

---

### Test 6: Access With Valid Cookie (Should Succeed)

1. **Use invite link** to set cookie (Test 4)

2. **Navigate to:**
   ```
   http://localhost:3000/client/demo-org
   ```

3. **Expected:**
   - ✅ Dashboard loads successfully
   - ✅ Summary cards visible
   - ✅ Lead list displays
   - ✅ No "Access Required" page

---

### Test 7: Cookie Mismatch (Wrong Org)

1. **Use invite for `demo-org`** (sets cookie)

2. **Try to access different org:**
   ```
   http://localhost:3000/client/another-org
   ```

3. **Expected:**
   - ✅ "Access Required" page shown
   - ✅ Access denied even though cookie exists
   - ✅ Cookie value doesn't match requested orgId

---

### Test 8: Expired Token

1. **Generate invite with 1-hour TTL:**
   ```bash
   curl -X POST http://localhost:3000/api/client/invite \
     -H "Content-Type: application/json" \
     -H "x-admin-secret: test-secret-12345" \
     -d '{"orgId": "demo-org", "phone": "+393514421114", "ttlHours": 0.001}'
   ```

2. **Wait 10 seconds**

3. **Use the link**

4. **Expected:**
   - ✅ Returns 401 error: "Invalid or expired invite token"
   - ✅ No redirect
   - ✅ No cookie set

---

### Test 9: Verify Event Logging

**Check database for invite events:**

```sql
SELECT 
  event_type,
  created_at,
  metadata->>'orgId' as org_id,
  metadata->>'phone' as phone,
  metadata->>'ttlHours' as ttl,
  metadata
FROM events
WHERE event_type IN ('invite.sent', 'invite.accepted')
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:**
- `invite.sent` events with orgId, phone, ttlHours
- `invite.accepted` events with orgId, acceptedAt, userAgent

---

### Test 10: Disable Invite Requirement

1. **Set in `.env.local`:**
   ```bash
   REQUIRE_CLIENT_INVITE=false
   ```

2. **Restart dev server**

3. **Navigate to:**
   ```
   http://localhost:3000/client/demo-org
   ```

4. **Expected:**
   - ✅ Dashboard loads WITHOUT cookie check
   - ✅ No invite link required
   - ✅ Direct access allowed

---

## 🔍 Security Verification

### Token Security

**Test token structure:**
```bash
# Generate a token
TOKEN=$(curl -s -X POST http://localhost:3000/api/client/invite \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: test-secret-12345" \
  -d '{"orgId": "test", "phone": "+15551234567"}' | jq -r '.link' | sed 's/.*token=//')

# Decode payload (before the dot)
echo $TOKEN | cut -d. -f1 | base64 -d 2>/dev/null || echo "(binary data)"
```

**Should show:**
```json
{"orgId":"test","exp":1729525600}
```

**Token format:**
- Part 1: Base64URL-encoded payload
- Part 2: HMAC-SHA256 signature
- No secret keys visible in token
- Expiration timestamp included

---

### Cookie Security

**Verify cookie attributes:**
- ✅ `HttpOnly` - Cannot be read by JavaScript
- ✅ `SameSite=Lax` - CSRF protection
- ✅ `Secure` (production only) - HTTPS only
- ✅ `Path=/` - Available to all client routes
- ✅ `Max-Age=604800` - 7 days

**Test in DevTools:**
1. Accept an invite
2. Open DevTools → Application → Cookies → localhost
3. Verify all attributes are set correctly

---

## 🐛 Troubleshooting

### Issue: "CLIENT_PORTAL_SECRET not configured"

**Fix:**
```bash
# Add to .env.local
CLIENT_PORTAL_SECRET=$(openssl rand -hex 32)

# Restart server
npm run dev
```

---

### Issue: SMS not sent

**Check terminal for:**
```
[ClientAPI] SMS send failed: ...
```

**Common causes:**
1. Twilio trial account - verify phone number
2. Missing Twilio credentials
3. Invalid phone format (must start with +)

**SMS still logs invite.sent event even if SMS fails**

---

### Issue: Token invalid immediately

**Possible causes:**
1. System clock skew
2. Different CLIENT_PORTAL_SECRET between generate & verify
3. Token parsing error

**Debug:**
```bash
# Check if secret is consistent
grep CLIENT_PORTAL_SECRET .env.local

# Generate and immediately use token
# Should work if secret is same
```

---

### Issue: Redirect loop

**Cause:** Cookie not being set properly

**Fix:**
1. Check browser allows cookies (not blocking)
2. Verify `Set-Cookie` header in network tab
3. Check for HTTPS requirement (Secure flag in prod)

---

### Issue: Access still blocked after using invite

**Check:**
1. Cookie was set (DevTools → Application → Cookies)
2. Cookie value matches orgId in URL
3. `REQUIRE_CLIENT_INVITE=true` in environment
4. Page reloaded after cookie was set

---

## 📊 Database Verification

### Count invites sent:

```sql
SELECT 
  COUNT(*) as total_invites,
  COUNT(DISTINCT metadata->>'orgId') as unique_orgs,
  COUNT(DISTINCT metadata->>'phone') as unique_phones
FROM events
WHERE event_type = 'invite.sent';
```

### Check acceptance rate:

```sql
SELECT 
  (SELECT COUNT(*) FROM events WHERE event_type = 'invite.sent') as sent,
  (SELECT COUNT(*) FROM events WHERE event_type = 'invite.accepted') as accepted,
  ROUND(
    100.0 * (SELECT COUNT(*) FROM events WHERE event_type = 'invite.accepted') / 
    NULLIF((SELECT COUNT(*) FROM events WHERE event_type = 'invite.sent'), 0), 
    2
  ) as acceptance_rate_percent;
```

### Recent invite activity:

```sql
SELECT 
  event_type,
  created_at,
  metadata->>'orgId' as org,
  metadata->>'phone' as phone
FROM events
WHERE event_type IN ('invite.sent', 'invite.accepted')
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🧪 End-to-End Test Flow

### Complete workflow:

1. **Start with clean state:**
   ```bash
   # Delete all cookies in browser (DevTools → Application → Clear storage)
   # Set REQUIRE_CLIENT_INVITE=true
   # Restart dev server
   ```

2. **Try direct access (should fail):**
   ```
   http://localhost:3000/client/demo-org
   → Shows "Access Required" page
   ```

3. **Generate invite via API:**
   ```bash
   curl -X POST http://localhost:3000/api/client/invite \
     -H "Content-Type: application/json" \
     -H "x-admin-secret: test-secret-12345" \
     -d '{"orgId": "demo-org", "phone": "+393514421114", "ttlHours": 24}'
   ```

4. **Copy the link from response**

5. **Open link in browser:**
   ```
   http://localhost:3000/client/access?token=...
   → Redirects to /client/demo-org
   → Dashboard loads successfully
   ```

6. **Verify cookie set:**
   ```
   DevTools → Application → Cookies → ll_client_org = demo-org
   ```

7. **Close and reopen browser:**
   ```
   http://localhost:3000/client/demo-org
   → Still works (cookie persists)
   ```

8. **Check events in database:**
   ```sql
   SELECT event_type, metadata 
   FROM events 
   WHERE event_type IN ('invite.sent', 'invite.accepted')
   ORDER BY created_at DESC 
   LIMIT 2;
   ```

---

## 🎨 Access Required Page (Visual)

When access is denied, user sees:

```
┌─────────────────────────────────────┐
│                                     │
│           🔒 (lock icon)            │
│                                     │
│        Access Required              │
│                                     │
│  You need an invite link to access  │
│  this organization's dashboard.     │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Organization:                 │ │
│  │ demo-org                      │ │
│  └───────────────────────────────┘ │
│                                     │
│  Ask your provider to send a fresh  │
│  invite link to access this portal. │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- Red lock icon in circle
- Clear heading
- Organization ID shown
- Helpful instruction
- Professional, not scary

---

## 🔐 Security Tests

### Test: Token Tampering

1. **Generate valid token**

2. **Modify the token slightly:**
   ```bash
   # Change last character
   VALID_TOKEN="eyJvcm...xyz"
   INVALID_TOKEN="eyJvcm...xyZ"  # Changed z to Z
   
   curl "http://localhost:3000/client/access?token=$INVALID_TOKEN"
   ```

3. **Expected:**
   - ✅ Returns 401 "Invalid or expired invite token"
   - ✅ Signature verification fails
   - ✅ No cookie set
   - ✅ No redirect

---

### Test: Token Replay After Expiry

1. **Generate token with 1-minute TTL:**
   ```bash
   curl -X POST http://localhost:3000/api/client/invite \
     -H "Content-Type: application/json" \
     -H "x-admin-secret: test-secret-12345" \
     -d '{"orgId": "demo-org", "phone": "+15551234567", "ttlHours": 0.0167}'
   ```

2. **Wait 2 minutes**

3. **Try to use the link**

4. **Expected:**
   - ✅ Returns 401 "Invalid or expired invite token"
   - ✅ No access granted

---

### Test: Cookie Isolation

1. **Get invite for `org-a`**
2. **Accept invite** (sets cookie for `org-a`)
3. **Try to access `org-b`:**
   ```
   http://localhost:3000/client/org-b
   ```

4. **Expected:**
   - ✅ "Access Required" page
   - ✅ Cookie doesn't grant access to different org

---

## 📱 SMS Delivery Test

### Test on your phone:

1. **Generate invite with your phone:**
   ```bash
   curl -X POST http://localhost:3000/api/client/invite \
     -H "Content-Type: application/json" \
     -H "x-admin-secret: test-secret-12345" \
     -d '{"orgId": "demo-org", "phone": "+393514421114", "ttlHours": 24}'
   ```

2. **Check your phone for SMS:**
   ```
   LeadLocker access: http://localhost:3000/client/access?token=... (expires in 24h)
   ```

3. **Click the link on your phone**

4. **Expected:**
   - ✅ Opens mobile browser
   - ✅ Redirects to dashboard
   - ✅ Dashboard displays correctly on mobile
   - ✅ Cookie persists on mobile

---

## 🧩 Integration Tests

### Test with Real Lead Data

1. **Ensure test data exists:**
   ```sql
   SELECT COUNT(*) FROM leads WHERE org_id = 'demo-org';
   -- Should return > 0
   ```

2. **Generate invite**

3. **Accept invite via link**

4. **Verify:**
   - ✅ Dashboard shows correct lead counts
   - ✅ Leads are visible in list
   - ✅ All features from Step 2 work (refresh, etc.)

---

### Test Multiple Organizations

1. **Create data for multiple orgs:**
   ```sql
   INSERT INTO leads (user_id, org_id, source, name, phone, description, status)
   VALUES 
     ('c96933ac-8a2b-484b-b9df-8e25d04e7f29', 'org-1', 'Web', 'User 1', '+15551111111', 'Test', 'NEW'),
     ('c96933ac-8a2b-484b-b9df-8e25d04e7f29', 'org-2', 'Web', 'User 2', '+15552222222', 'Test', 'NEW');
   ```

2. **Generate invites for both:**
   ```bash
   # Invite for org-1
   curl -X POST http://localhost:3000/api/client/invite \
     -H "Content-Type: application/json" \
     -H "x-admin-secret: test-secret-12345" \
     -d '{"orgId": "org-1", "phone": "+15551111111"}'
   
   # Invite for org-2
   curl -X POST http://localhost:3000/api/client/invite \
     -H "Content-Type: application/json" \
     -H "x-admin-secret: test-secret-12345" \
     -d '{"orgId": "org-2", "phone": "+15552222222"}'
   ```

3. **Verify:**
   - ✅ Each link works for its specific org
   - ✅ Cookies are org-specific
   - ✅ No cross-org access

---

## 📋 Environment Variable Reference

### Required for Step 3:

| Variable | Purpose | Example |
|----------|---------|---------|
| `CLIENT_PORTAL_SECRET` | HMAC signing key | `a3f8d9e2b1c4...` |
| `CRON_SECRET` | Admin auth (temporary) | `test-secret-12345` |
| `NEXT_PUBLIC_BASE_URL` | Link generation | `http://localhost:3000` |
| `REQUIRE_CLIENT_INVITE` | Enable/disable gating | `true` |
| `TWILIO_*` | SMS delivery | (from Phase 1) |

### Optional:

| Variable | Default | Purpose |
|----------|---------|---------|
| `ttlHours` in request | 24 | Invite expiration time |

---

## ✨ Success Criteria

When working correctly:

### API Endpoint
- ✅ Returns 401 without admin auth
- ✅ Returns 400 for invalid input
- ✅ Generates valid signed tokens
- ✅ Sends SMS with invite link
- ✅ Logs `invite.sent` event
- ✅ Returns invite link in response

### Access Route
- ✅ Validates token signature
- ✅ Checks token expiration
- ✅ Sets HTTP-only cookie
- ✅ Redirects to client portal
- ✅ Logs `invite.accepted` event
- ✅ Returns 401 for invalid tokens

### Portal Page Gating
- ✅ Checks cookie when `REQUIRE_CLIENT_INVITE=true`
- ✅ Shows "Access Required" if no cookie
- ✅ Shows "Access Required" if wrong org cookie
- ✅ Allows access with valid cookie
- ✅ Bypasses check when `REQUIRE_CLIENT_INVITE=false`

### Event Logging
- ✅ `invite.sent` logged with orgId, phone, ttlHours
- ✅ `invite.accepted` logged with orgId, timestamp, userAgent
- ✅ Events queryable in database

---

## 🚀 Production Considerations

### Environment Variables (Vercel)

Add to Vercel:
```bash
CLIENT_PORTAL_SECRET=<secure-random-hex>
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
REQUIRE_CLIENT_INVITE=true
```

### HTTPS in Production

- Cookie `Secure` flag automatically enabled in production
- Invite links will use HTTPS automatically
- No code changes needed

### Token Expiry

**Default:** 24 hours  
**Recommended for production:** 
- 24 hours for initial access
- 7-day cookie for return visits
- Consider shorter TTL for high-security orgs

---

## 📚 Related Files

- Token Utils: `/src/libs/signing.ts`
- Invite API: `/src/app/api/client/invite/route.ts`
- Access Route: `/src/app/client/access/route.ts`
- Portal Page: `/src/app/client/[orgId]/page.tsx`
- Testing: `/docs/phase5_step3_testing.md`

---

## 🎯 What's Next

**Phase 5 Step 4:** Lead Sharing Policies with RLS  
**Phase 5 Step 5:** Analytics Lite

---

## 🎉 Step 3 Complete!

You now have:
- ✅ Signed, time-limited invite tokens
- ✅ SMS delivery of invite links
- ✅ Cookie-based session management
- ✅ Access gating with friendly UI
- ✅ Event logging for audit trail
- ✅ No database changes required
- ✅ Production-ready security

**The invite system is operational!** 🚀

