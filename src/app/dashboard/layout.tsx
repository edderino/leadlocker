import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabaseServer";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
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
      redirect("/login");
    }

    // ---------------------------
    // 4. CHECK ONBOARDING
    // ---------------------------
    if (!client.onboarding_complete) {
      redirect("/onboarding");
    }

    // ---------------------------
    // 5. RENDER LAYOUT
    // ---------------------------
    return (
      <div className="min-h-screen flex flex-col bg-black text-white">
        {children}
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
    console.error("[DashboardLayout] Error:", err);
    redirect("/login");
  }
}
