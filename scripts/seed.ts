import * as dotenv from "dotenv";

// Force-load only the clean prod env file, override everything
dotenv.config({ path: ".env.clean.final.prod.local", override: true });

console.log("[FORCED LOAD] env file:", ".env.clean.final.prod.local");
console.log("SUPABASE_SERVICE_ROLE_KEY =", process.env.SUPABASE_SERVICE_ROLE_KEY);

import { createClient } from "@supabase/supabase-js";

console.log("[DEBUG] Loaded env vars:", Object.keys(process.env));

console.log("[DEBUG] Raw values:");
for (const [key, value] of Object.entries(process.env)) {
  if (key.startsWith("SUPABASE") || key.startsWith("TWILIO") || key.startsWith("NEXT_PUBLIC")) {
    console.log(`${key} =`, JSON.stringify(value));
  }
}

// Seed script for LeadLocker demo environment
async function main() {
  console.log("KEY BYTES:", Array.from(Buffer.from(process.env.SUPABASE_SERVICE_ROLE_KEY || "")));
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // --- 1. Delete existing demo data ---
  console.log("🧹 Cleaning up existing demo data...");
  
  const orgId = "demo-org";
  
  // Delete demo user's leads first (foreign key constraint)
  await supabase.from("leads").delete().eq("org_id", orgId);
  
  // Delete demo user
  await supabase.from("users").delete().eq("email", "demo@leadlocker.local");

  // --- 2. Create Demo User ---
  const { data: user, error: userErr } = await supabase
    .from("users")
    .insert({
      email: "demo@leadlocker.local",
      name: "Demo User",
      phone: "+61400000000",
    })
    .select()
    .single();

  if (userErr) throw userErr;
  console.log("✅ User created:", user.name, `(${user.email})`);

  // --- 3. Create Demo Leads ---
  const leadsData = [
    {
      user_id: user.id,
      org_id: orgId,
      name: "John Carter",
      phone: "+61411111111",
      source: "Website",
      status: "NEW",
      description: "Interested in our services",
    },
    {
      user_id: user.id,
      org_id: orgId,
      name: "Mia Rossi",
      phone: "+61422222222",
      source: "Facebook",
      status: "NEW",
      description: "Looking for a quote",
    },
    {
      user_id: user.id,
      org_id: orgId,
      name: "Luca Bianchi",
      phone: "+61433333333",
      source: "Google",
      status: "NEW",
      description: "Needs electrical work",
    },
  ];

  const { data: leads, error: leadsErr } = await supabase
    .from("leads")
    .insert(leadsData)
    .select();

  if (leadsErr) throw leadsErr;
  console.log(`✅ ${leads.length} leads created`);

  console.log("\n🎉 Demo user and leads seeded successfully!");
  console.log(`\n📝 Summary:`);
  console.log(`   User: ${user.name} (${user.email})`);
  console.log(`   User ID: ${user.id}`);
  console.log(`   Leads: ${leads.length}`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});

