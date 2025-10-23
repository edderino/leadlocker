import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

/**
 * Generate invite token for client onboarding
 * Usage: npx tsx scripts/generate-invite.ts <orgId> [hours]
 */

const orgId = process.argv[2];
const ttlHours = parseInt(process.argv[3]) || 168; // Default: 7 days

if (!orgId) {
  console.error("❌ Usage: npx tsx scripts/generate-invite.ts <orgId> [hours]");
  console.error("   Example: npx tsx scripts/generate-invite.ts client-123 168");
  process.exit(1);
}

try {
  // Generate token using production endpoint
  const response = await fetch(`https://leadlocker.vercel.app/api/debug/generate-token?orgId=${orgId}&hours=${ttlHours}`);
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error);
  }
  
  console.log("🎉 Client Invite Token Generated!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📋 Organization ID: ${data.orgId}`);
  console.log(`⏰ Expires in: ${data.ttlHours} hours (${Math.round(data.ttlHours/24)} days)`);
  console.log(`🔗 Invite URL: ${data.inviteUrl}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🔑 Token: ${data.token}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
} catch (error: any) {
  console.error("❌ Failed to generate token:", error.message);
  process.exit(1);
}
