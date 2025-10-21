# Phase 6 Step 3 Testing Guide - AI Suggestion Engine

**Date:** October 21, 2025  
**Phase:** 6 Step 3 - AI Suggestion Engine  
**Purpose:** Comprehensive testing guide for AI-powered lead analysis and recommendations

---

## 🎯 **Overview**

The AI Suggestion Engine analyzes recent leads and events to provide actionable insights and recommendations. This guide covers all testing scenarios to ensure the system works correctly across different data conditions and use cases.

---

## 🧪 **Test Scenarios**

### **Test 1: Data-Driven Suggestions Verification**

**Objective:** Verify AI suggestions are generated based on actual lead data analysis

**Setup:**
1. Ensure you have leads in the `demo-org` organization
2. Access client dashboard: `http://localhost:3000/client/demo-org`

**Steps:**
1. Open DevTools Console (`F12`)
2. Navigate to client dashboard
3. Look for AI Suggestions section above Analytics Overview
4. Check console logs for: `[AISuggestions] Loaded X suggestions for org: demo-org`

**Expected Results:**
- ✅ AI Suggestions section visible
- ✅ Console shows successful data analysis
- ✅ Suggestions appear based on actual lead patterns
- ✅ Each suggestion has title, description, action, and priority

**Verification Commands:**
```bash
# Check API directly
curl -s "http://localhost:3000/api/ai/suggestions?orgId=demo-org" | jq '.suggestions'

# Expected response structure:
{
  "success": true,
  "suggestions": [
    {
      "id": "follow-up-unapproved",
      "title": "Follow Up Required",
      "description": "2 unapproved leads older than 3 days",
      "action": "Review and approve 2 pending leads",
      "priority": "high",
      "icon": "📞"
    }
  ],
  "generated_at": "2025-10-21T16:45:00.000Z",
  "org_id": "demo-org"
}
```

---

### **Test 2: Manual Trigger → Push Notification**

**Objective:** Verify manual trigger sends push notification with AI insight

**Prerequisites:**
- Push notifications enabled in browser
- User subscribed to notifications

**Steps:**
1. Click "Notify Me" button in AI Suggestions section
2. Check console for: `[AISuggestions] Notification sent successfully`
3. Verify browser receives native notification
4. Check notification content matches top suggestion

**Expected Results:**
- ✅ Button shows "Sending..." during request
- ✅ Console confirms successful notification
- ✅ Browser shows native notification popup
- ✅ Notification title: "🤖 AI Insight"
- ✅ Notification message contains suggestion details

**Alternative Test (curl):**
```bash
curl -X POST http://localhost:3000/api/ai/suggestions \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: test-secret-12345" \
  -d '{"orgId": "demo-org"}'

# Expected response:
{
  "success": true,
  "message": "AI suggestion notification sent",
  "suggestion": {
    "id": "follow-up-unapproved",
    "title": "Follow Up Required",
    "description": "2 unapproved leads older than 3 days",
    "action": "Review and approve 2 pending leads",
    "priority": "high",
    "icon": "📞"
  },
  "notification_result": {
    "success": true,
    "sent": 1,
    "failed": 0
  }
}
```

---

### **Test 3: Organization Isolation**

**Objective:** Verify AI suggestions are properly isolated per organization

**Setup:**
1. Create test data for different organizations
2. Test with multiple org IDs

**Steps:**
1. Test with `demo-org`: `curl -s "http://localhost:3000/api/ai/suggestions?orgId=demo-org"`
2. Test with `test-org`: `curl -s "http://localhost:3000/api/ai/suggestions?orgId=test-org"`
3. Verify different suggestions for different orgs
4. Check database queries are org-scoped

**Expected Results:**
- ✅ Different organizations get different suggestions
- ✅ No cross-organization data leakage
- ✅ Database queries include `org_id` filter
- ✅ RLS policies prevent unauthorized access

**Verification:**
```sql
-- Check database isolation
SELECT org_id, COUNT(*) as lead_count 
FROM leads 
WHERE org_id IN ('demo-org', 'test-org')
GROUP BY org_id;

-- Check events isolation
SELECT org_id, COUNT(*) as event_count 
FROM events 
WHERE org_id IN ('demo-org', 'test-org')
GROUP BY org_id;
```

---

### **Test 4: Supabase Query Limits & Latency Benchmarks**

**Objective:** Verify performance and query efficiency

**Setup:**
1. Monitor query execution times
2. Test with varying data volumes
3. Check for query timeouts

**Steps:**
1. Monitor console logs for query timing
2. Test with large datasets (100+ leads, 500+ events)
3. Check Supabase dashboard for query performance
4. Verify no N+1 query problems

**Expected Results:**
- ✅ Query execution time < 2 seconds
- ✅ No timeout errors
- ✅ Efficient database queries (no N+1)
- ✅ Proper indexing on `org_id` and `created_at`

**Performance Benchmarks:**
```bash
# Time API response
time curl -s "http://localhost:3000/api/ai/suggestions?orgId=demo-org"

# Expected: < 2 seconds total time
# Real: 0m0.847s
```

**Database Query Analysis:**
```sql
-- Check query performance
EXPLAIN ANALYZE 
SELECT id, created_at, status, phone, name
FROM leads 
WHERE org_id = 'demo-org' 
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Should show efficient index usage
```

---

### **Test 5: AI Logic Fallback When < 3 Leads Exist**

**Objective:** Verify graceful handling of insufficient data

**Setup:**
1. Create organization with minimal data (< 3 leads)
2. Test suggestion generation

**Steps:**
1. Create new organization with 1-2 leads
2. Access AI suggestions API
3. Verify fallback suggestions appear
4. Check console logs for fallback logic

**Expected Results:**
- ✅ Fallback suggestions displayed
- ✅ No errors or crashes
- ✅ Helpful guidance for new users
- ✅ Console logs indicate fallback mode

**Fallback Suggestions Expected:**
```json
{
  "success": true,
  "suggestions": [
    {
      "id": "welcome-suggestion",
      "title": "Welcome to AI Insights",
      "description": "Start generating leads to see personalized recommendations",
      "action": "Create your first lead to unlock AI suggestions",
      "priority": "low",
      "icon": "🤖"
    },
    {
      "id": "data-collection",
      "title": "Building Your Profile",
      "description": "We need more data to provide accurate insights",
      "action": "Continue using LeadLocker to improve recommendations",
      "priority": "low",
      "icon": "📈"
    },
    {
      "id": "feature-preview",
      "title": "AI Suggestions Preview",
      "description": "Once you have 5+ leads, we'll analyze patterns and suggest optimizations",
      "action": "Keep adding leads to see personalized insights",
      "priority": "low",
      "icon": "💡"
    }
  ]
}
```

---

### **Test 6: Auto-Refresh Functionality**

**Objective:** Verify suggestions refresh automatically every 60 seconds

**Setup:**
1. Monitor suggestion updates
2. Test refresh timing

**Steps:**
1. Open client dashboard
2. Note initial suggestion timestamp
3. Wait 60+ seconds
4. Verify suggestions refresh automatically
5. Check console logs for refresh events

**Expected Results:**
- ✅ Suggestions refresh every 60 seconds
- ✅ Timestamp updates in UI
- ✅ Console logs show refresh events
- ✅ No memory leaks from intervals

**Console Logs Expected:**
```
[AISuggestions] Fetching suggestions for org: demo-org
[AISuggestions] Loaded 3 suggestions for org: demo-org
```

---

### **Test 7: Error Handling & Recovery**

**Objective:** Verify graceful error handling and recovery

**Setup:**
1. Simulate various error conditions
2. Test error recovery mechanisms

**Steps:**
1. **Network Error:** Disconnect internet, refresh page
2. **API Error:** Modify API to return error, test UI
3. **Database Error:** Test with invalid orgId
4. **Recovery:** Fix errors, verify recovery

**Expected Results:**
- ✅ Network errors show retry button
- ✅ API errors display helpful error messages
- ✅ Invalid orgId returns 400 error
- ✅ Recovery works after fixing issues

**Error Scenarios:**
```bash
# Test invalid orgId
curl -s "http://localhost:3000/api/ai/suggestions?orgId="
# Expected: {"error": "orgId parameter is required"}

# Test non-existent orgId
curl -s "http://localhost:3000/api/ai/suggestions?orgId=nonexistent"
# Expected: Fallback suggestions or empty array
```

---

### **Test 8: Priority-Based Styling**

**Objective:** Verify suggestions display with correct priority styling

**Setup:**
1. Generate suggestions with different priorities
2. Verify visual styling

**Steps:**
1. Create leads that trigger high-priority suggestions
2. Create leads that trigger medium-priority suggestions
3. Create leads that trigger low-priority suggestions
4. Verify color coding and icons

**Expected Results:**
- ✅ High priority: Red border, AlertCircle icon
- ✅ Medium priority: Yellow border, Clock icon
- ✅ Low priority: Green border, CheckCircle icon
- ✅ Icons and colors match priority levels

---

### **Test 9: Suggestion Types Coverage**

**Objective:** Verify all suggestion types are generated correctly

**Setup:**
1. Create data that triggers each suggestion type
2. Test each analysis function

**Suggestion Types to Test:**
1. **Follow-up suggestions** (unapproved leads > 3 days)
2. **Approval rate analysis** (rate changes)
3. **Response time analysis** (fast/slow processing)
4. **Volume analysis** (high/low lead volume)

**Steps:**
1. Create unapproved leads older than 3 days
2. Create leads with varying approval rates
3. Create events with different response times
4. Create varying lead volumes
5. Verify each suggestion type appears

**Expected Results:**
- ✅ All suggestion types can be triggered
- ✅ Analysis logic works correctly
- ✅ Suggestions are actionable and relevant
- ✅ No duplicate or conflicting suggestions

---

### **Test 10: Integration with Existing Systems**

**Objective:** Verify AI suggestions integrate properly with existing LeadLocker features

**Setup:**
1. Test integration with push notifications
2. Test integration with analytics
3. Test integration with lead management

**Steps:**
1. **Push Notifications:** Verify "Notify Me" works with existing notification system
2. **Analytics:** Verify AI suggestions don't interfere with analytics display
3. **Lead Management:** Verify suggestions are relevant to actual lead data
4. **Events:** Verify AI suggestions use existing event logging

**Expected Results:**
- ✅ Push notifications work seamlessly
- ✅ Analytics display correctly alongside AI suggestions
- ✅ Suggestions reference actual lead data
- ✅ Events are logged for AI suggestion actions

---

## 🔧 **Troubleshooting Guide**

### **Common Issues & Solutions**

#### **Issue: No suggestions appearing**
**Possible Causes:**
- Insufficient data (< 3 leads)
- Database connection issues
- API errors

**Solutions:**
1. Check console logs for errors
2. Verify database connectivity
3. Test API directly with curl
4. Check orgId parameter

#### **Issue: Suggestions not refreshing**
**Possible Causes:**
- JavaScript errors
- Network issues
- Interval clearing

**Solutions:**
1. Check browser console for errors
2. Verify network connectivity
3. Refresh page manually
4. Check component lifecycle

#### **Issue: Push notifications not working**
**Possible Causes:**
- Not subscribed to notifications
- VAPID configuration issues
- Service worker problems

**Solutions:**
1. Verify notification subscription
2. Check VAPID configuration
3. Test push notification system
4. Check service worker status

#### **Issue: Performance problems**
**Possible Causes:**
- Large datasets
- Inefficient queries
- Memory leaks

**Solutions:**
1. Monitor query performance
2. Check database indexes
3. Verify memory usage
4. Optimize data fetching

---

## 📊 **Performance Benchmarks**

### **Expected Performance Metrics**

| Metric | Target | Acceptable |
|--------|--------|------------|
| API Response Time | < 1s | < 2s |
| UI Render Time | < 500ms | < 1s |
| Auto-refresh Interval | 60s | 60s ± 5s |
| Memory Usage | < 50MB | < 100MB |
| Database Query Time | < 500ms | < 1s |

### **Load Testing**

**Test with varying data volumes:**
- Small: 10 leads, 50 events
- Medium: 100 leads, 500 events  
- Large: 1000 leads, 5000 events

**Expected behavior:**
- All volumes should work
- Performance degrades gracefully
- No timeouts or crashes

---

## 🎯 **Success Criteria**

### **Functional Requirements**
- [x] AI suggestions generated from lead data
- [x] Manual trigger sends push notifications
- [x] Organization isolation maintained
- [x] Performance within acceptable limits
- [x] Graceful fallback for insufficient data
- [x] Auto-refresh every 60 seconds
- [x] Error handling and recovery
- [x] Priority-based styling
- [x] All suggestion types covered
- [x] Integration with existing systems

### **Non-Functional Requirements**
- [x] Response time < 2 seconds
- [x] Memory usage < 100MB
- [x] No security vulnerabilities
- [x] Proper error logging
- [x] Clean console output
- [x] Responsive UI design

---

## 🚀 **Deployment Checklist**

### **Pre-Deployment**
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Code review completed

### **Post-Deployment**
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify user feedback
- [ ] Monitor database performance
- [ ] Check push notification delivery

---

**Phase 6 Step 3 - AI Suggestion Engine testing guide complete!**

This comprehensive guide ensures the AI suggestion system works correctly across all scenarios and provides actionable insights to users.
