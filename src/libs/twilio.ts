import twilio, { Twilio } from 'twilio'
import { log } from './log'

let _client: Twilio | null = null

function getTwilioClient(): Twilio | null {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) return null
  if (_client) return _client
  _client = twilio(sid, token)
  return _client
}

/** Safe sender: no-ops if Twilio isn't configured. */
export async function sendSMS(to: string, body: string) {
  try {
    console.log('[Twilio] Attempting to send SMS...');
    console.log('[Twilio] To:', to);
    console.log('[Twilio] Body length:', body.length);
    
    const from = process.env.TWILIO_FROM_NUMBER
    const client = getTwilioClient()
    
    console.log('[Twilio] From number:', from || 'NOT SET');
    console.log('[Twilio] Client initialized:', client ? 'Yes' : 'No');
    console.log('[Twilio] TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'NOT SET');
    console.log('[Twilio] TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'NOT SET');
    
    if (!client || !from) {
      const missingVars = [];
      if (!process.env.TWILIO_ACCOUNT_SID) missingVars.push('TWILIO_ACCOUNT_SID');
      if (!process.env.TWILIO_AUTH_TOKEN) missingVars.push('TWILIO_AUTH_TOKEN');
      if (!from) missingVars.push('TWILIO_FROM_NUMBER');
      
      throw new Error(`Twilio not configured. Missing: ${missingVars.join(', ')}`);
    }
    
    console.log('[Twilio] Calling Twilio API...');
    const res = await client.messages.create({ from, to, body })
    
    console.log('[Twilio] ✅ SMS sent successfully. SID:', res.sid);
    log("SMS sent", to)
    return res
  } catch (err: any) {
    console.error('[Twilio] ❌ SMS send failed:', err.message);
    if (err.code) console.error('[Twilio] Error code:', err.code);
    if (err.status) console.error('[Twilio] HTTP status:', err.status);
    
    log("SMS send failed", err.message)
    return { error: err.message }
  }
}

export function isTwilioConfigured() {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER)
}
