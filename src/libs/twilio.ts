import twilio, { Twilio } from 'twilio'

let _client: Twilio | null = null

function getTwilioClient(): Twilio | null {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) return null
  if (_client) return _client
  _client = twilio(sid, token)
  return _client
}

/**
 * Safe SMS sender. If Twilio is not configured, it logs and no-ops.
 */
export async function sendSMS(to: string, body: string) {
  const from = process.env.TWILIO_FROM_NUMBER
  const client = getTwilioClient()

  if (!client || !from) {
    console.warn('[LeadLocker] Twilio not configured. Skipping SMS.', {
      hasClient: !!client,
      hasFrom: !!from,
    })
    return { skipped: true }
  }

  return client.messages.create({ from, to, body })
}

export function isTwilioConfigured() {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER)
}
