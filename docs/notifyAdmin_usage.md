# notifyAdmin() - Usage Guide

Quick reference for integrating admin error alerts into any API route.

---

## 📦 Import

```typescript
import { notifyAdmin } from '@/libs/notifyAdmin';
```

---

## 🔧 Function Signature

```typescript
notifyAdmin(errorSource: string, error: any): Promise<void>
```

**Parameters:**
- `errorSource` - String identifying where the error occurred (e.g., `/api/cron/cleanup`)
- `error` - The error object or message to report

**Returns:** `Promise<void>` - Always resolves, never throws

---

## ✅ Basic Usage Pattern

### In API Routes

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { notifyAdmin } from '@/libs/notifyAdmin';

export async function POST(request: NextRequest) {
  try {
    // Your route logic here
    const data = await someOperation();
    
    return NextResponse.json({ success: true, data });
    
  } catch (error: any) {
    console.error('[YourRoute] Operation failed:', error);
    
    // Send admin alert
    await notifyAdmin('/api/your-route', error);
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 📋 Examples

### Example 1: Database Error

```typescript
try {
  const { data, error } = await supabaseAdmin
    .from('leads')
    .select('*');
    
  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }
  
  return data;
  
} catch (error) {
  await notifyAdmin('/api/leads/fetch', error);
  throw error; // Re-throw if needed
}
```

### Example 2: External API Error

```typescript
try {
  const response = await fetch('https://api.example.com/data');
  
  if (!response.ok) {
    throw new Error(`API returned ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
  
} catch (error) {
  await notifyAdmin('/api/external-sync', error);
  return null; // Or handle gracefully
}
```

### Example 3: Validation Error

```typescript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

try {
  const validated = schema.parse(requestBody);
  // Process validated data
  
} catch (error) {
  if (error instanceof z.ZodError) {
    // Don't alert for validation errors (user mistake, not system error)
    console.warn('Validation failed:', error);
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  
  // Only alert for unexpected errors
  await notifyAdmin('/api/submit-form', error);
  return NextResponse.json({ error: 'Internal error' }, { status: 500 });
}
```

### Example 4: Critical Path Protection

```typescript
async function criticalOperation() {
  try {
    await transferPayment();
    await updateDatabase();
    await sendConfirmation();
    
  } catch (error) {
    // Critical operation failed - alert immediately
    await notifyAdmin('/api/payment/process', error);
    
    // Also log to monitoring service if available
    // await logToSentry(error);
    
    throw error; // Re-throw for caller to handle
  }
}
```

---

## ⚠️ Best Practices

### ✅ DO Use notifyAdmin For:

- **Critical failures** - Payment processing, data corruption, etc.
- **System errors** - Database down, external API failures
- **Cron job failures** - Scheduled tasks that silently fail
- **Configuration errors** - Missing env vars, invalid credentials
- **Data integrity issues** - Unexpected null values, constraint violations

### ❌ DON'T Use notifyAdmin For:

- **User input validation errors** - Handle these with normal error responses
- **Expected business logic** - "No results found", "Already exists", etc.
- **Rate limiting** - These are intentional blocks, not errors
- **Authentication failures** - Would spam admin with every failed login
- **High-frequency operations** - Would result in SMS spam

---

## 🔒 What Happens When Called

1. **Logs `error.alert` event to database**
   ```json
   {
     "event_type": "error.alert",
     "metadata": {
       "source": "/api/cron/cleanup",
       "message": "Database connection failed",
       "timestamp": "2025-10-20T17:32:15.482Z",
       "error_type": "Error",
       "stack": "Error: Database connection failed..."
     }
   }
   ```

2. **Sends SMS to admin**
   ```
   ⚠️ LeadLocker Error
   Source: /api/cron/cleanup
   Message: Database connection failed
   Time: 2025-10-20T17:32:15.482Z
   ```

3. **Never throws errors**
   - If SMS fails → logs to console, continues
   - If DB insert fails → logs to console, continues
   - Always returns successfully to prevent cascading failures

---

## 🧪 Testing

### Local Testing

Temporarily break something to trigger an error:

```typescript
// Before
const data = await supabaseAdmin.from('leads').select('*');

// Temporarily change to trigger error
const data = await supabaseAdmin.from('nonexistent_table').select('*');

// Test your route
// Then revert the change!
```

### Verify Alert Sent

Check Supabase for the event:
```sql
SELECT * FROM events 
WHERE event_type = 'error.alert' 
ORDER BY created_at DESC 
LIMIT 1;
```

Check your phone for the SMS alert.

---

## 🔍 Monitoring

### View All Error Alerts

```sql
SELECT 
  created_at,
  metadata->>'source' as source,
  metadata->>'message' as message
FROM events
WHERE event_type = 'error.alert'
ORDER BY created_at DESC
LIMIT 20;
```

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

---

## 🚨 Rate Limiting (Future Enhancement)

To prevent SMS spam during cascading failures:

```typescript
async function notifyAdminWithRateLimit(errorSource: string, error: any) {
  // Check if we've alerted in the last hour
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  
  const { data: recentAlerts } = await supabaseAdmin
    .from('events')
    .select('created_at')
    .eq('event_type', 'error.alert')
    .eq('metadata->>source', errorSource)
    .gte('created_at', oneHourAgo);
  
  if (recentAlerts && recentAlerts.length > 0) {
    // Skip SMS, but still log to database
    console.log(`[AdminAlert] Skipping SMS - already alerted about ${errorSource} in last hour`);
    return;
  }
  
  await notifyAdmin(errorSource, error);
}
```

---

## 📚 Related Files

- Implementation: `/src/libs/notifyAdmin.ts`
- Usage Examples: 
  - `/src/app/api/cron/daily-summary/route.ts`
  - `/src/app/api/cron/cleanup/route.ts`
- Testing Guide: `/docs/phase4_step3_testing.md`

