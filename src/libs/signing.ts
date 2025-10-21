import { createHmac } from 'crypto';

/**
 * HMAC-based token signing for client invites.
 * No database required - tokens are self-contained and time-limited.
 */

interface InvitePayload {
  orgId: string;
  exp: number; // Expiration timestamp (seconds since epoch)
}

/**
 * Create a signed invite token for a client organization.
 * 
 * @param orgId - Organization identifier
 * @param ttlHours - Time-to-live in hours (default: 24)
 * @returns Base64URL-encoded signed token
 */
export function createInviteToken(orgId: string, ttlHours: number = 24): string {
  const secret = process.env.CLIENT_PORTAL_SECRET;
  
  if (!secret) {
    throw new Error('CLIENT_PORTAL_SECRET not configured');
  }

  // Create payload with expiration
  const exp = Math.floor(Date.now() / 1000) + (ttlHours * 3600);
  const payload: InvitePayload = { orgId, exp };

  // Encode payload as base64url
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadJson).toString('base64url');

  // Create HMAC signature
  const hmac = createHmac('sha256', secret);
  hmac.update(payloadB64);
  const signature = hmac.digest('base64url');

  // Combine payload.signature
  return `${payloadB64}.${signature}`;
}

/**
 * Verify and decode an invite token.
 * 
 * @param token - The token to verify
 * @returns Decoded payload if valid, null if invalid/expired
 */
export function verifyInviteToken(token: string): { orgId: string } | null {
  try {
    const secret = process.env.CLIENT_PORTAL_SECRET;
    
    if (!secret) {
      console.error('[Signing] CLIENT_PORTAL_SECRET not configured');
      return null;
    }

    // Split token into payload and signature
    const parts = token.split('.');
    if (parts.length !== 2) {
      console.error('[Signing] Invalid token format');
      return null;
    }

    const [payloadB64, providedSignature] = parts;

    // Verify signature
    const hmac = createHmac('sha256', secret);
    hmac.update(payloadB64);
    const expectedSignature = hmac.digest('base64url');

    if (providedSignature !== expectedSignature) {
      console.error('[Signing] Invalid signature');
      return null;
    }

    // Decode payload
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload: InvitePayload = JSON.parse(payloadJson);

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.error('[Signing] Token expired');
      return null;
    }

    return { orgId: payload.orgId };

  } catch (error) {
    console.error('[Signing] Token verification failed:', error);
    return null;
  }
}

