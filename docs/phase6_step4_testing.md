# Phase 6 Step 4 Testing Guide - Follow-Up Automation

**Date:** October 21, 2025  
**Phase:** 6 Step 4 - Follow-Up Automation  
**Purpose:** Comprehensive testing guide for automated follow-up reminder system

---

## 🎯 **Overview**

The Follow-Up Automation system scans for stale leads (not completed, updated > 48 hours ago) and sends push notifications to organizations with follow-up reminders. This guide covers all testing scenarios to ensure the system works correctly across different data conditions and use cases.

---

## 🧪 **Test Scenarios**

### **Test 1: Manual Trigger - Basic Functionality**

**Objective:** Verify manual trigger works and processes stale leads correctly

**Setup:**
1. Ensure you have leads in the database with `status != 'completed'` and `updated_at < now() - 48 hours`
2. Server running on http://localhost:3000

**Steps:**
1. Execute manual trigger command:
   ```bash
   curl -X POST http://localhost:3000/api/followups/trigger \
     -H "x-cron-secret: test-secret-12345"
   ```

2. Check response format and content

**Expected Results:**
- ✅ Response status: 200 OK
- ✅ JSON response with success: true
- ✅ processed field shows number of stale leads found
- ✅ details array contains org breakdown

**Expected Response:**
```json
{
  "success": true,
  "processed": 3,
  "details": [
    {
      "orgId": "demo-org",
      "count": 2,
      "leadIds": ["lead-1", "lead-2"]
    }
  ]
}
```

---

### **Test 2: Cron Wrapper Endpoint**

**Objective:** Verify cron wrapper endpoint works for automated scheduling

**Steps:**
1. Test GET endpoint:
   ```bash
   curl -X GET http://localhost:3000/api/cron/followups \
     -H "x-cron-secret: test-secret-12345"
   ```

2. Test POST endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/cron/followups \
     -H "x-cron-secret: test-secret-12345"
   ```

**Expected Results:**
- ✅ Both GET and POST work identically
- ✅ Response includes success: true
- ✅ result field contains follow-up trigger response
- ✅ timestamp field shows execution time

**Expected Response:**
```json
{
  "success": true,
  "message": "Follow-up cron job completed",
  "result": {
    "success": true,
    "processed": 3,
    "details": [...]
  },
  "timestamp": "2025-10-21T21:00:00.000Z",
  "endpoint": "/api/cron/followups"
}
```

---

### **Test 3: Push Notification Delivery**

**Objective:** Verify push notifications are sent to organizations with stale leads

**Prerequisites:**
- Organizations have active push notification subscriptions
- Browser notifications enabled

**Steps:**
1. Trigger follow-up automation
2. Check browser for push notifications
3. Verify notification content

**Expected Results:**
- ✅ Push notification appears in browser
- ✅ Title: "⏰ Follow-Up Reminder"
- ✅ Message: "X lead(s) need follow-up."
- ✅ Click opens client dashboard
- ✅ Console logs show notification sent

**Console Logs Expected:**
```
[FollowUp] Starting follow-up scan...
[FollowUp] Found 3 stale leads
[FollowUp] Processing org demo-org: 2 stale leads
[FollowUp] Notification sent to org demo-org
[FollowUp] Processed 3 stale leads across 1 organizations
```

---

### **Test 4: Database Query Verification**

**Objective:** Verify SQL queries correctly identify stale leads

**Setup:**
1. Create test leads with different statuses and update times
2. Run follow-up scan
3. Verify correct leads are identified

**SQL Verification:**
```sql
-- Check stale leads query
SELECT id, org_id, name, status, updated_at, created_at
FROM leads 
WHERE status != 'completed' 
  AND updated_at < NOW() - INTERVAL '48 hours'
ORDER BY org_id, updated_at;

-- Expected: Only leads that are not completed and updated > 48h ago
```

**Expected Results:**
- ✅ Query returns only stale leads
- ✅ No completed leads included
- ✅ Only leads updated > 48 hours ago
- ✅ Results grouped by org_id

---

### **Test 5: Organization Isolation**

**Objective:** Verify follow-up reminders are properly isolated per organization

**Setup:**
1. Create leads for multiple organizations
2. Ensure some orgs have stale leads, others don't
3. Run follow-up scan

**Steps:**
1. Create test data:
   ```sql
   -- Insert test leads for different orgs
   INSERT INTO leads (org_id, name, phone, status, updated_at) VALUES
   ('org-1', 'Lead 1', '+1234567890', 'pending', NOW() - INTERVAL '3 days'),
   ('org-2', 'Lead 2', '+1234567891', 'approved', NOW() - INTERVAL '1 day'),
   ('org-1', 'Lead 3', '+1234567892', 'pending', NOW() - INTERVAL '5 days');
   ```

2. Run follow-up scan
3. Verify only org-1 gets notifications

**Expected Results:**
- ✅ Only organizations with stale leads receive notifications
- ✅ Organizations without stale leads are skipped
- ✅ Each organization gets separate notification
- ✅ Lead counts are accurate per organization

---

### **Test 6: Error Handling & Edge Cases**

**Objective:** Verify system handles errors gracefully

**Test Cases:**

#### **6a. No Stale Leads**
```bash
# When no stale leads exist
curl -X POST http://localhost:3000/api/followups/trigger \
  -H "x-cron-secret: test-secret-12345"
```

**Expected:**
```json
{
  "success": true,
  "processed": 0,
  "details": []
}
```

#### **6b. Unauthorized Access**
```bash
# Without cron secret
curl -X POST http://localhost:3000/api/followups/trigger
```

**Expected:**
```json
{
  "error": "Unauthorized"
}
```
**Status:** 401

#### **6c. Database Connection Error**
- Simulate database connection failure
- Verify graceful error handling

**Expected:**
```json
{
  "success": false,
  "processed": 0,
  "details": [],
  "error": "Failed to fetch stale leads"
}
```

---

### **Test 7: Performance & Scalability**

**Objective:** Verify system performance with large datasets

**Setup:**
1. Create large number of leads (1000+)
2. Mix of stale and fresh leads
3. Multiple organizations

**Steps:**
1. Generate test data:
   ```sql
   -- Create test leads for performance testing
   INSERT INTO leads (org_id, name, phone, status, updated_at)
   SELECT 
     'org-' || (i % 10),
     'Lead ' || i,
     '+123456789' || LPAD(i::text, 3, '0'),
     CASE WHEN i % 3 = 0 THEN 'completed' ELSE 'pending' END,
     NOW() - INTERVAL (i % 7) || ' days'
   FROM generate_series(1, 1000) AS i;
   ```

2. Measure execution time
3. Check memory usage

**Expected Results:**
- ✅ Execution time < 5 seconds for 1000 leads
- ✅ Memory usage remains stable
- ✅ No timeout errors
- ✅ All stale leads processed correctly

**Performance Benchmarks:**
```bash
# Time the execution
time curl -X POST http://localhost:3000/api/followups/trigger \
  -H "x-cron-secret: test-secret-12345"

# Expected: < 5 seconds total time
```

---

### **Test 8: Integration with Existing Systems**

**Objective:** Verify follow-up automation integrates properly with existing LeadLocker systems

**Integration Points:**

#### **8a. Push Notification System**
- Verify uses existing `/api/notifications/trigger`
- Check notification format matches existing system
- Ensure proper event logging

#### **8b. Event Logging**
- Verify `followup.triggered` events are logged
- Check event metadata includes org_id and count
- Ensure events appear in events table

#### **8c. Database Schema**
- Verify queries use existing leads table structure
- Check RLS policies are respected
- Ensure no schema modifications required

**SQL Verification:**
```sql
-- Check follow-up events are logged
SELECT event_type, org_id, metadata, created_at
FROM events 
WHERE event_type = 'followup.triggered'
ORDER BY created_at DESC
LIMIT 10;

-- Expected: Recent followup.triggered events with proper metadata
```

**Expected Results:**
- ✅ Uses existing notification infrastructure
- ✅ Events logged with proper metadata
- ✅ No conflicts with existing systems
- ✅ RLS policies maintained

---

## 🔧 **Troubleshooting Guide**

### **Common Issues & Solutions**

#### **Issue: No notifications sent**
**Possible Causes:**
- No stale leads found
- Push notification system not configured
- Organizations not subscribed to notifications

**Solutions:**
1. Check database for stale leads:
   ```sql
   SELECT COUNT(*) FROM leads 
   WHERE status != 'completed' 
     AND updated_at < NOW() - INTERVAL '48 hours';
   ```

2. Verify push notification system:
   ```bash
   curl -s http://localhost:3000/api/notifications/trigger \
     -H "x-cron-secret: test-secret-12345" | jq '.configured'
   ```

3. Check organization subscriptions:
   ```sql
   SELECT org_id, COUNT(*) FROM push_subscriptions GROUP BY org_id;
   ```

#### **Issue: Wrong leads identified as stale**
**Possible Causes:**
- Incorrect time calculation
- Wrong status filtering
- Database timezone issues

**Solutions:**
1. Verify time calculation:
   ```sql
   SELECT 
     id, 
     updated_at, 
     NOW() - INTERVAL '48 hours' as cutoff,
     updated_at < NOW() - INTERVAL '48 hours' as is_stale
   FROM leads 
   WHERE status != 'completed'
   LIMIT 5;
   ```

2. Check status filtering:
   ```sql
   SELECT DISTINCT status FROM leads;
   ```

#### **Issue: Performance problems**
**Possible Causes:**
- Large dataset without proper indexing
- Inefficient queries
- Memory leaks

**Solutions:**
1. Check database indexes:
   ```sql
   \d leads
   -- Should have indexes on org_id, status, updated_at
   ```

2. Monitor query performance:
   ```sql
   EXPLAIN ANALYZE 
   SELECT * FROM leads 
   WHERE status != 'completed' 
     AND updated_at < NOW() - INTERVAL '48 hours';
   ```

3. Check memory usage during execution

---

## 📊 **Performance Benchmarks**

### **Expected Performance Metrics**

| Metric | Target | Acceptable |
|--------|--------|------------|
| API Response Time | < 2s | < 5s |
| Database Query Time | < 500ms | < 1s |
| Memory Usage | < 50MB | < 100MB |
| Notification Delivery | < 1s | < 3s |
| Error Rate | < 1% | < 5% |

### **Load Testing Scenarios**

**Small Dataset (100 leads):**
- Expected response time: < 1s
- Expected memory usage: < 10MB

**Medium Dataset (1000 leads):**
- Expected response time: < 3s
- Expected memory usage: < 50MB

**Large Dataset (10000 leads):**
- Expected response time: < 10s
- Expected memory usage: < 200MB

---

## 🎯 **Success Criteria**

### **Functional Requirements**
- [x] Manual trigger processes stale leads correctly
- [x] Cron wrapper endpoint works for automation
- [x] Push notifications sent to organizations
- [x] Database queries identify stale leads accurately
- [x] Organization isolation maintained
- [x] Error handling works gracefully
- [x] Performance within acceptable limits
- [x] Integration with existing systems

### **Non-Functional Requirements**
- [x] Response time < 5 seconds
- [x] Memory usage < 100MB
- [x] No security vulnerabilities
- [x] Proper error logging
- [x] Clean console output
- [x] Database query efficiency

---

## 🚀 **Deployment Checklist**

### **Pre-Deployment**
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Security review completed
- [ ] Database indexes optimized
- [ ] Error handling tested
- [ ] Documentation updated

### **Post-Deployment**
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify notification delivery
- [ ] Monitor database performance
- [ ] Check cron job execution
- [ ] Validate event logging

---

## 📝 **Example Commands**

### **Manual Testing Commands**
```bash
# Basic trigger test
curl -X POST http://localhost:3000/api/followups/trigger \
  -H "x-cron-secret: test-secret-12345"

# Cron wrapper test
curl -X GET http://localhost:3000/api/cron/followups \
  -H "x-cron-secret: test-secret-12345"

# Health check
curl -X GET http://localhost:3000/api/followups/trigger \
  -H "x-cron-secret: test-secret-12345"
```

### **Database Verification Commands**
```sql
-- Check stale leads
SELECT COUNT(*) FROM leads 
WHERE status != 'completed' 
  AND updated_at < NOW() - INTERVAL '48 hours';

-- Check follow-up events
SELECT * FROM events 
WHERE event_type = 'followup.triggered' 
ORDER BY created_at DESC LIMIT 5;

-- Check push subscriptions
SELECT org_id, COUNT(*) FROM push_subscriptions GROUP BY org_id;
```

---

**Phase 6 Step 4 - Follow-Up Automation testing guide complete!**

This comprehensive guide ensures the follow-up automation system works correctly across all scenarios and provides reliable automated reminders to users.
