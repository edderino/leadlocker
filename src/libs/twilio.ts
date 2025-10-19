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
    const from = process.env.TWILIO_FROM_NUMBER
    const client = getTwilioClient()
    if (!client || !from) throw new Error("Twilio not configured")
    const res = await client.messages.create({ from, to, body })
    log("SMS sent", to)
    return res
  } catch (err: any) {
    log("SMS send failed", err.message)
    return { error: err.message }
  }
}

export function isTwilioConfigured() {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER)
}
