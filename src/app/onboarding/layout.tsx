import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabaseServer";

export const dynamic = "force-dynamic";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    // ---------------------------
    // 1. READ TOKENS FROM COOKIES
    // ---------------------------
    const cookieStore = cookies();
    const token =
      cookieStore.get("sb-access-token")?.value ||
      cookieStore.get("ll_session")?.value;

    if (!token) {
      redirect("/login");
    }

    // ---------------------------
    // 2. VALIDATE TOKEN
    // ---------------------------
    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.getUser(
      token
    );

    if (authError || !authData?.user) {
      redirect("/login");
    }

    const userId = authData.user.id;

    // ---------------------------
    // 3. FETCH CLIENT ROW
    // ---------------------------
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (clientError || !client) {
      redirect("/signup?error=no_client");
    }

    // ---------------------------
    // 4. CHECK ONBOARDING STATUS
    // ---------------------------
    // If onboarding is already complete, redirect to dashboard
    if (client.onboarding_complete === true) {
      redirect("/dashboard");
    }

    // ---------------------------
    // 5. RENDER ONBOARDING
    // ---------------------------
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
    // Next.js redirect() throws a NEXT_REDIRECT error - we need to re-throw it
    const isRedirect =
      (err instanceof Error && err.message === "NEXT_REDIRECT") ||
      (err &&
        typeof err === "object" &&
        "digest" in err &&
        typeof err.digest === "string" &&
        err.digest.startsWith("NEXT_REDIRECT"));

    if (isRedirect) {
      throw err;
    }

    // Only log actual errors, not redirects
    console.error("[OnboardingLayout] Error:", err);
    redirect("/login");
  }
}
