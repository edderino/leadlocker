import { config } from "dotenv";
import { createInviteToken } from "../src/libs/signing";

// Load environment variables
config({ path: ".env.local" });

/**
 * Generate invite token for client onboarding
 * Usage: npx tsx scripts/generate-invite.ts <orgId> [hours]
 */

const orgId = process.argv[2];
const ttlHours = parseInt(process.argv[3]) || 24; // Default: 24 hours

if (!orgId) {
  console.error("❌ Usage: npx tsx scripts/generate-invite.ts <orgId> [hours]");
  console.error("   Example: npx tsx scripts/generate-invite.ts client-123 168");
  process.exit(1);
}

try {
  const token = createInviteToken(orgId, ttlHours);
  
  console.log("🎉 Client Invite Token Generated!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📋 Organization ID: ${orgId}`);
  console.log(`⏰ Expires in: ${ttlHours} hours (${Math.round(ttlHours/24)} days)`);
  console.log(`🔗 Invite URL: https://leadlocker.vercel.app/client/access?token=${token}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🔑 Token: ${token}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
} catch (error: any) {
  console.error("❌ Failed to generate token:", error.message);
  process.exit(1);
}
