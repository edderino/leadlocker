import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  console.log("[ONBOARDING LAYOUT] 🚀 Starting auth check");
  try {
    const cookieStore = await cookies();
    const llSession = cookieStore.get("ll_session");
    const sbAccessToken = cookieStore.get("sb-access-token");
    const sessionToken = llSession?.value || sbAccessToken?.value || null;

    console.log("[ONBOARDING LAYOUT] 📋 Cookie check:", {
      has_ll_session: !!llSession?.value,
      has_sb_access_token: !!sbAccessToken?.value,
      has_token: !!sessionToken,
      all_cookies: cookieStore.getAll().map(c => ({ name: c.name, hasValue: !!c.value })),
    });

    if (!sessionToken) {
      console.error("[ONBOARDING LAYOUT] ❌ No session token, redirecting to /login");
      return redirect("/login");
    }

    console.log("[ONBOARDING LAYOUT] ✅ Token found, validating...");

    // Validate token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    console.log("[ONBOARDING LAYOUT] 🔧 Environment check:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!serviceKey,
    });

    if (!supabaseUrl || !serviceKey) {
      console.error("[ONBOARDING LAYOUT] ❌ Missing env vars, redirecting to /login");
      return redirect("/login");
    }

    console.log("[ONBOARDING LAYOUT] 🔐 Creating Supabase admin client...");
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    console.log("[ONBOARDING LAYOUT] 🔍 Validating token...");
    const {
      data: userRes,
      error: userErr,
    } = await admin.auth.getUser(sessionToken);

    console.log("[ONBOARDING LAYOUT] 📋 Token validation result:", {
      hasError: !!userErr,
      errorMessage: userErr?.message,
      hasUser: !!userRes?.user,
      userId: userRes?.user?.id,
    });

    if (userErr || !userRes?.user) {
      console.error("[ONBOARDING LAYOUT] ❌ Invalid token, redirecting to /login");
      return redirect("/login");
    }

    const userId = userRes.user.id;
    console.log("[ONBOARDING LAYOUT] ✅ Token valid, user ID:", userId);

    // Fetch client row
    console.log("[ONBOARDING LAYOUT] 🔍 Fetching client row...");
    const { data: client } = await admin
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    console.log("[ONBOARDING LAYOUT] 📋 Client fetch result:", {
      hasClient: !!client,
      clientId: client?.id,
      onboarding_complete: client?.onboarding_complete,
    });

    // If client doesn't exist, redirect to signup
    if (!client) {
      console.error("[ONBOARDING LAYOUT] ❌ No client found, redirecting to /signup");
      return redirect("/signup?error=no_client");
    }

    // If onboarding is already complete, redirect to dashboard
    if (client.onboarding_complete === true) {
      console.log("[ONBOARDING LAYOUT] ✅ Onboarding already complete, redirecting to /dashboard");
      return redirect("/dashboard");
    }

    console.log("[ONBOARDING LAYOUT] ✅ All checks passed, showing onboarding");

    // User is authenticated and needs onboarding - show onboarding
    const pathname = "/onboarding"; // Simplified for now
    
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center py-12 px-4">
        <div className="w-full max-w-2xl">
          <h1 className="text-3xl font-bold text-center mb-10">Get Your Account Set Up</h1>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-xl">
            {children}
          </div>

          {/* Step indicator */}
          <div className="flex justify-center mt-8 space-x-4 text-sm text-gray-400">
            <span className="opacity-100">Step 1</span>
            <span>•</span>
            <span className="opacity-50">Step 2</span>
            <span>•</span>
            <span className="opacity-50">Step 3</span>
          </div>
        </div>
      </div>
    );
  } catch (err) {
    console.error("[ONBOARDING LAYOUT] ❌ UNEXPECTED ERROR:", err);
    console.error("[ONBOARDING LAYOUT] ❌ Error stack:", err instanceof Error ? err.stack : "No stack");
    return redirect("/login");
  }
}
