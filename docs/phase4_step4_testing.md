# Phase 4 Step 4: Testing Dashboard Activity Feed

## ✅ Implementation Complete

The Activity Feed has been added to the dashboard with:
- Live auto-refresh every 15 seconds
- Color-coded event types
- Grouped by day (Today / Yesterday / Older)
- Click to expand for metadata details
- Relative timestamps ("3 min ago")
- Fade-in animations for new events

---

## 📁 Files Created

1. **`/src/app/api/events/recent/route.ts`** - API endpoint for fetching events
2. **`/src/components/ActivityFeed.tsx`** - Activity feed component
3. Updated **`/src/app/page.tsx`** - Integrated feed into dashboard

---

## 🎨 Event Color Coding

| Event Type | Icon | Color | Background |
|------------|------|-------|------------|
| `lead.created` | 🟢 | Green | Light green |
| `lead.status_updated` | 🟡 | Yellow | Light yellow |
| `sms.sent` | 🟣 | Purple | Light purple |
| `summary.sent` | 🔵 | Blue | Light blue |
| `cleanup.run` | 🔵 | Blue | Light blue |
| `error.alert` | ⚠️ | Red | Light red with red left border |

---

## 🧪 Testing Steps

### Test 1: View Existing Events

1. **Navigate to dashboard:**
   ```
   http://localhost:3000
   ```

2. **Look for Activity Feed section** (between lead form and lead list)

3. **Verify you see existing events:**
   - Should show all event types
   - Events grouped by "Today", "Yesterday", "Older"
   - Each event has icon, description, and relative time

4. **Expected to see:**
   - The 4 `error.alert` events from Phase 4 Step 3 testing
   - Various `sms.sent`, `summary.sent`, `lead.created` events
   - Any cleanup runs

---

### Test 2: Create a New Lead (Real-Time Update)

1. **Fill out lead form on dashboard:**
   - Name: "Test User Activity Feed"
   - Phone: "+1234567890"
   - Source: "Website"
   - Description: "Testing activity feed"

2. **Submit the form**

3. **Watch the Activity Feed:**
   - Within 15 seconds (or immediately if you refresh), you should see:
   - 🟢 **Lead Created:** "New lead: Test User Activity Feed from Website"
   - 🟣 **SMS Sent:** "SMS notification to +1234567890" (if Twilio configured)

---

### Test 3: Update Lead Status

1. **In the lead list, mark the test lead as "Reconciled"**

2. **Watch the Activity Feed:**
   - Within 15 seconds: 🟡 **Status Updated** event appears
   - Message: "Lead status: NEW → APPROVED" (or similar)

---

### Test 4: Trigger Error Alert

**Method A: Use Test Endpoint (if still exists):**
```bash
curl http://localhost:3000/api/test/notify-admin
```

**Method B: Temporarily Break Cleanup Route:**
1. Change `/src/app/api/cron/cleanup/route.ts` line 61:
   - From: `.from('leads')`  
   - To: `.from('invalid_table')`

2. Trigger cleanup:
   ```bash
   curl -X POST http://localhost:3000/api/cron/cleanup \
     -H "x-cron-secret: test-secret-12345"
   ```

3. **Revert the change immediately**

4. **Check Activity Feed:**
   - ⚠️ **Red error alert** with left border appears
   - Message shows source and error description
   - Click to expand and see full stack trace

---

### Test 5: Auto-Refresh

1. **Open dashboard**
2. **Note the "Last updated: X seconds ago" text** (top right of feed)
3. **Wait 15-20 seconds**
4. **Observe:**
   - "Last updated" changes to "a few seconds ago"
   - If any new events occurred, they appear automatically
   - No page refresh needed!

---

### Test 6: Event Expansion (Metadata Details)

1. **Click on any event in the feed**
2. **Verify:**
   - Event expands to show full metadata
   - Metadata displayed as formatted JSON
   - Click again to collapse

**Example expanded metadata for `error.alert`:**
```json
{
  "source": "/api/cron/cleanup",
  "message": "Failed to delete leads...",
  "timestamp": "2025-10-20T18:25:37.355Z",
  "error_type": "Error",
  "stack": "Error: Failed to delete leads..."
}
```

---

### Test 7: Manual Summary

1. **Trigger manual summary:**
   ```bash
   curl http://localhost:3000/api/summary/send
   ```

2. **Check Activity Feed:**
   - 🔵 **Summary Sent** event appears
   - Shows total lead count
   - 🟣 **SMS Sent** event also appears (if phone configured)

---

### Test 8: API Endpoint Direct Test

**Test with limit:**
```bash
curl http://localhost:3000/api/events/recent?limit=10 | jq
```

**Expected response:**
```json
{
  "success": true,
  "events": [...],
  "count": 10
}
```

**Test with type filter:**
```bash
curl "http://localhost:3000/api/events/recent?type=error.alert" | jq
```

**Expected:** Only error.alert events returned

---

## 🎨 Visual Verification

### Layout Order (top to bottom):
1. **Header** - "LeadLocker"
2. **Summary Card** - Today's stats
3. **Add New Lead Form**
4. **Activity Feed** ← New!
5. **Recent Leads List**

### Activity Feed Features:
- ✅ White background with rounded corners and shadow
- ✅ "Activity Feed" heading with last updated timestamp
- ✅ Scrollable area (max 600px height)
- ✅ Events grouped by day with section headers
- ✅ Color-coded backgrounds for each event type
- ✅ Relative timestamps on the right
- ✅ Hover effect (shadow increase)
- ✅ Error alerts have red left border
- ✅ Smooth fade-in animation for events

---

## 🐛 Troubleshooting

### Issue: "No activity yet"

**Cause:** No events in database or API failing

**Fix:**
1. Check browser console for errors
2. Test API directly: `curl http://localhost:3000/api/events/recent`
3. Verify events table has data:
   ```sql
   SELECT COUNT(*) FROM events;
   ```

---

### Issue: Feed not auto-refreshing

**Cause:** JavaScript error or interval not running

**Fix:**
1. Check browser console for errors
2. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
3. Verify no build errors in terminal

---

### Issue: Events show wrong time

**Cause:** Timezone confusion (database in UTC)

**Fix:**
- This is normal! Database stores in UTC
- The "X min ago" format handles timezone automatically
- Actual time conversion happens in browser

---

### Issue: Metadata not showing on click

**Cause:** Event has no metadata or click handler not working

**Fix:**
1. Check if event has metadata in database
2. Try clicking different event
3. Check browser console for errors

---

## 📊 Database Queries for Testing

### Add Test Events

```sql
-- Add a test event
INSERT INTO events (event_type, actor_id, metadata)
VALUES (
  'test.manual',
  'c96933ac-8a2b-484b-b9df-8e25d04e7f29',
  '{"message": "Manual test event from SQL"}'::jsonb
);
```

### View Recent Events

```sql
SELECT 
  event_type,
  created_at,
  metadata->>'message' as message
FROM events
ORDER BY created_at DESC
LIMIT 20;
```

### Count Events by Type

```sql
SELECT 
  event_type,
  COUNT(*) as count
FROM events
GROUP BY event_type
ORDER BY count DESC;
```

### Delete Old Test Events

```sql
DELETE FROM events
WHERE event_type = 'test.manual';
```

---

## ✨ Success Criteria

When working correctly:

- ✅ Activity feed visible on dashboard below lead form
- ✅ Shows existing events from database
- ✅ Auto-refreshes every 15 seconds
- ✅ New leads appear in feed within 15 seconds
- ✅ Status updates appear in feed
- ✅ Error alerts shown in red with ⚠️ icon
- ✅ Events grouped by Today/Yesterday/Older
- ✅ Click to expand shows metadata
- ✅ Relative timestamps ("3 min ago")
- ✅ Smooth animations
- ✅ Scrollable when many events
- ✅ No console errors

---

## 🚀 Production Considerations

### Performance
- Limit set to 50 events by default (configurable up to 100)
- Events cached for 15 seconds (auto-refresh interval)
- Scrollable container prevents page bloat

### Future Enhancements
- **Realtime subscriptions** - Use Supabase Realtime instead of polling
- **Filters** - Allow filtering by event type
- **Search** - Search event messages
- **Export** - Download event log as CSV
- **Pagination** - Load more events on scroll

### Monitoring
- Watch browser console for API errors
- Monitor `/api/events/recent` response times in Vercel
- Check if events table gets too large (cleanup handles this)

---

## 📚 Related Files

- Component: `/src/components/ActivityFeed.tsx`
- API Route: `/src/app/api/events/recent/route.ts`
- Dashboard: `/src/app/page.tsx`
- Phase 4 Context: `/docs/leadlocker_phase4_context.md`

---

## 🎉 Phase 4 Complete!

With Step 4 done, you now have:
- ✅ **Step 1:** Automated daily summaries
- ✅ **Step 2:** Auto-cleanup of old data
- ✅ **Step 3:** Error alerts to admin
- ✅ **Step 4:** Live dashboard activity feed

**Your automation layer is fully operational!** 🚀

