#!/usr/bin/env node

import { config } from "dotenv";
import { createInviteToken } from "../src/libs/signing.js";

// Load environment variables
config({ path: ".env.local" });

/**
 * Generate invite token for client onboarding
 * Usage: node scripts/generate-invite.js <orgId> [hours]
 */

const orgId = process.argv[2];
const ttlHours = parseInt(process.argv[3]) || 168; // Default: 7 days

if (!orgId) {
  console.error("❌ Usage: node scripts/generate-invite.js <orgId> [hours]");
  console.error("   Example: node scripts/generate-invite.js client-123 168");
  process.exit(1);
}

try {
  const token = createInviteToken(orgId, ttlHours);
  
  console.log("🎉 Client Invite Token Generated!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📋 Organization ID: ${orgId}`);
  console.log(`⏰ Expires in: ${ttlHours} hours (${Math.round(ttlHours/24)} days)`);
  console.log(`🔗 Invite URL: https://your-domain.com/client/access?token=${token}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🔑 Token: ${token}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
} catch (error) {
  console.error("❌ Failed to generate token:", error.message);
  process.exit(1);
}
