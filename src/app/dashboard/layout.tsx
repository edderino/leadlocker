import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic"; // required for using cookies()

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  console.log("[DASHBOARD LAYOUT] 🚀 Starting auth check");
  console.log("[DASHBOARD LAYOUT] ⏰ Timestamp:", new Date().toISOString());
  try {
    const cookieStore = await cookies();
    
    // Get ALL cookies to see what the server actually received
    const allCookies = cookieStore.getAll();
    console.log("[DASHBOARD LAYOUT] 📦 ALL COOKIES RECEIVED BY SERVER:", {
      totalCookies: allCookies.length,
      cookieNames: allCookies.map(c => c.name),
      cookieDetails: allCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0,
        valuePrefix: c.value ? `${c.value.substring(0, 30)}...` : "empty",
      })),
    });
    
    const llSession = cookieStore.get("ll_session");
    const sbAccessToken = cookieStore.get("sb-access-token");
    const sessionToken = llSession?.value || sbAccessToken?.value || null;

    console.log("[DASHBOARD LAYOUT] 📋 Cookie check:", {
      has_ll_session: !!llSession?.value,
      ll_session_value: llSession?.value ? `${llSession.value.substring(0, 20)}...` : "none",
      ll_session_full_length: llSession?.value?.length || 0,
      has_sb_access_token: !!sbAccessToken?.value,
      sb_access_token_value: sbAccessToken?.value ? `${sbAccessToken.value.substring(0, 20)}...` : "none",
      sb_access_token_full_length: sbAccessToken?.value?.length || 0,
      has_token: !!sessionToken,
      token_length: sessionToken?.length || 0,
    });

    if (!sessionToken) {
      console.error("[DASHBOARD LAYOUT] ❌ No session token found, redirecting to /login");
      return redirect("/login");
    }

    console.log("[DASHBOARD LAYOUT] ✅ Token found, validating...");

    // Validate token directly using Supabase admin client (no internal fetch needed)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    console.log("[DASHBOARD LAYOUT] 🔧 Environment check:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!serviceKey,
      supabaseUrlPrefix: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "none",
    });

    if (!supabaseUrl || !serviceKey) {
      console.error("[DASHBOARD LAYOUT] ❌ Missing Supabase env vars");
      return redirect("/login");
    }

    console.log("[DASHBOARD LAYOUT] 🔐 Creating Supabase admin client...");
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    console.log("[DASHBOARD LAYOUT] 🔍 Validating token with Supabase...");
    const {
      data: userRes,
      error: userErr,
    } = await admin.auth.getUser(sessionToken);

    console.log("[DASHBOARD LAYOUT] 📋 Token validation result:", {
      hasError: !!userErr,
      errorMessage: userErr?.message,
      errorStatus: userErr?.status,
      hasUser: !!userRes?.user,
      userId: userRes?.user?.id,
      userEmail: userRes?.user?.email,
    });

    if (userErr || !userRes?.user) {
      console.error("[DASHBOARD LAYOUT] ❌ Invalid token, redirecting to /login:", {
        error: userErr,
        message: userErr?.message,
        status: userErr?.status,
        hasUser: !!userRes?.user,
      });
      return redirect("/login");
    }

    const userId = userRes.user.id;
    console.log("[DASHBOARD LAYOUT] ✅ Token valid, user ID:", userId);

    // Fetch client row
    console.log("[DASHBOARD LAYOUT] 🔍 Fetching client row for user_id:", userId);
    const { data: client, error: clientErr } = await admin
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    console.log("[DASHBOARD LAYOUT] 📋 Client fetch result:", {
      hasError: !!clientErr,
      errorMessage: clientErr?.message,
      hasClient: !!client,
      clientId: client?.id,
      clientSlug: client?.slug,
      onboarding_complete: client?.onboarding_complete,
      onboarding_complete_type: typeof client?.onboarding_complete,
    });

    if (clientErr) {
      console.error("[DASHBOARD LAYOUT] ❌ Database error, redirecting to /login:", clientErr);
      return redirect("/login");
    }

    // If no client found, redirect to login
    if (!client) {
      console.error("[DASHBOARD LAYOUT] ❌ No client found for user_id:", userId, "redirecting to /login");
      return redirect("/login");
    }

    // 🚧 BLOCK dashboard if onboarding not complete
    // onboarding_complete can be null, false, or true - only allow true
    console.log("[DASHBOARD LAYOUT] 🔍 Checking onboarding status:", {
      onboarding_complete: client.onboarding_complete,
      onboarding_complete_type: typeof client.onboarding_complete,
      isTrue: client.onboarding_complete === true,
      isNotTrue: client.onboarding_complete !== true,
    });

    if (client.onboarding_complete !== true) {
      console.log("[DASHBOARD LAYOUT] ⚠️ Onboarding incomplete, redirecting to /onboarding", {
        onboarding_complete: client.onboarding_complete,
        type: typeof client.onboarding_complete,
      });
      return redirect("/onboarding");
    }

    console.log("[DASHBOARD LAYOUT] ✅ All checks passed, rendering dashboard");

    return (
      <div className="min-h-screen flex flex-col bg-black text-white">
        {children}
      </div>
    );
  } catch (err) {
    // Next.js redirect() throws a NEXT_REDIRECT error - we need to re-throw it
    // Check both message and digest (digest is more reliable)
    const isRedirect = 
      (err instanceof Error && err.message === "NEXT_REDIRECT") ||
      (err && typeof err === "object" && "digest" in err && 
       typeof err.digest === "string" && err.digest.startsWith("NEXT_REDIRECT"));
    
    if (isRedirect) {
      console.log("[DASHBOARD LAYOUT] 🔄 Re-throwing redirect error");
      throw err;
    }
    
    console.error("[DASHBOARD LAYOUT] ❌ UNEXPECTED ERROR:", err);
    console.error("[DASHBOARD LAYOUT] ❌ Error stack:", err instanceof Error ? err.stack : "No stack");
    return redirect("/login");
  }
}
