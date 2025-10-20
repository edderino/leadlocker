import { supabaseAdmin } from '@/libs/supabaseAdmin';
import { sendSMS } from '@/libs/twilio';

/**
 * Notify admin via SMS when critical errors occur in cron jobs or API routes.
 * Logs an error.alert event to the database and sends an SMS to the admin phone.
 * Fails silently to avoid infinite error loops.
 * 
 * @param errorSource - The source of the error (e.g., "/api/cron/cleanup")
 * @param error - The error object or message
 */
export async function notifyAdmin(errorSource: string, error: any): Promise<void> {
  try {
    console.log('[notifyAdmin] ===== TRIGGERED =====');
    console.log('[notifyAdmin] Source:', errorSource);
    console.log('[notifyAdmin] Error:', error?.message || error);
    
    const timestamp = new Date().toISOString();
    const errorMessage = error?.message || String(error);
    const adminPhone = process.env.LL_DEFAULT_USER_PHONE;

    console.log('[notifyAdmin] Admin phone configured:', adminPhone ? `Yes (${adminPhone})` : 'No');
    console.log('[notifyAdmin] Timestamp:', timestamp);

    // 1. Log error.alert event to database
    console.log('[notifyAdmin] Step 1: Attempting to log error.alert event to database...');
    try {
      const { data, error: dbError } = await supabaseAdmin.from('events').insert({
        event_type: 'error.alert',
        lead_id: null,
        actor_id: 'c96933ac-8a2b-484b-b9df-8e25d04e7f29', // System user
        metadata: {
          source: errorSource,
          message: errorMessage,
          timestamp,
          error_type: error?.name || 'Unknown',
          stack: error?.stack?.substring(0, 500) || null, // First 500 chars of stack trace
        },
      });

      if (dbError) {
        console.error('[notifyAdmin] ❌ Database insert failed:', dbError);
      } else {
        console.log('[notifyAdmin] ✅ Database event logged successfully');
      }
    } catch (dbError) {
      console.error('[notifyAdmin] ❌ Database operation threw exception:', dbError);
    }

    // 2. Send SMS alert to admin
    console.log('[notifyAdmin] Step 2: Attempting to send SMS alert...');
    if (adminPhone) {
      const smsBody = `⚠️ LeadLocker Error
Source: ${errorSource}
Message: ${errorMessage.substring(0, 100)}
Time: ${timestamp}`;

      console.log('[notifyAdmin] SMS body prepared (length:', smsBody.length, ')');
      console.log('[notifyAdmin] Sending SMS to:', adminPhone);

      try {
        const smsResult = await sendSMS(adminPhone, smsBody);
        
        if (smsResult && 'error' in smsResult) {
          console.error('[notifyAdmin] ❌ SMS send failed:', smsResult.error);
        } else {
          console.log('[notifyAdmin] ✅ SMS sent successfully:', smsResult);
        }
      } catch (smsError) {
        console.error('[notifyAdmin] ❌ SMS operation threw exception:', smsError);
      }
    } else {
      console.warn('[notifyAdmin] ⚠️ LL_DEFAULT_USER_PHONE not configured - skipping SMS alert');
    }

    console.log('[notifyAdmin] ===== COMPLETED =====');
  } catch (outerError) {
    // Ultimate safety net - log but never throw
    console.error('[notifyAdmin] ❌ CRITICAL FAILURE in notifyAdmin:', outerError);
  }
}

