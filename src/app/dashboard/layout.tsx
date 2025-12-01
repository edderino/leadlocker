import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic"; // required for using cookies()

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  try {
    const cookieStore = await cookies();
    const sessionToken =
      cookieStore.get("ll_session")?.value ||
      cookieStore.get("sb-access-token")?.value ||
      null;

    console.log("[DashboardLayout] Session check:", {
      has_ll_session: !!cookieStore.get("ll_session")?.value,
      has_sb_access_token: !!cookieStore.get("sb-access-token")?.value,
      has_token: !!sessionToken,
    });

    if (!sessionToken) {
      console.log("[DashboardLayout] No session token, redirecting to login");
      return redirect("/login");
    }

    // Validate token directly using Supabase admin client (no internal fetch needed)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !serviceKey) {
      console.error("[DashboardLayout] Missing Supabase env vars");
      return redirect("/login");
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const {
      data: userRes,
      error: userErr,
    } = await admin.auth.getUser(sessionToken);

    if (userErr || !userRes?.user) {
      console.error("[DashboardLayout] Invalid token:", userErr);
      return redirect("/login");
    }

    const userId = userRes.user.id;

    // Fetch client row
    const { data: client, error: clientErr } = await admin
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (clientErr) {
      console.error("[DashboardLayout] Database error:", clientErr);
      return redirect("/login");
    }

    console.log("[DashboardLayout] Client data:", {
      has_client: !!client,
      onboarding_complete: client?.onboarding_complete,
      client_id: client?.id,
    });

    // If no client found, redirect to login
    if (!client) {
      console.log("[DashboardLayout] No client found, redirecting to login");
      return redirect("/login");
    }

    // 🚧 BLOCK dashboard if onboarding not complete
    if (!client.onboarding_complete) {
      console.log("[DashboardLayout] Onboarding incomplete, redirecting to /onboarding");
      return redirect("/onboarding");
    }

    return (
      <div className="min-h-screen flex flex-col bg-black text-white">
        {children}
      </div>
    );
  } catch (err) {
    console.error("DashboardLayout error:", err);
    return redirect("/login");
  }
}
