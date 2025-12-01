import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  try {
    const cookieStore = await cookies();
    const sessionToken =
      cookieStore.get("ll_session")?.value ||
      cookieStore.get("sb-access-token")?.value ||
      null;

    if (!sessionToken) {
      return redirect("/login");
    }

    // Validate token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !serviceKey) {
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
      return redirect("/login");
    }

    const userId = userRes.user.id;

    // Fetch client row
    const { data: client } = await admin
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    // If client doesn't exist, redirect to signup
    if (!client) {
      return redirect("/signup?error=no_client");
    }

    // If onboarding is already complete, redirect to dashboard
    if (client.onboarding_complete === true) {
      return redirect("/dashboard");
    }

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
    console.error("OnboardingLayout error:", err);
    return redirect("/login");
  }
}
