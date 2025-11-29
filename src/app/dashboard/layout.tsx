import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    // Read session/access cookie
    const cookieStore = await cookies();
    const token =
      cookieStore.get("ll_session")?.value ||
      cookieStore.get("sb-access-token")?.value;

    if (!token) {
      // No session cookie → kick them to login
      redirect("/login");
    }

    // If we get here → user appears to have a session.
    // Deeper validation is handled in API routes (/api/auth/me, Supabase RLS).
    // WorkspaceLayout has its own sidebar and navigation, so we just render children.
    return <>{children}</>;
  } catch (error) {
    // If anything fails, redirect to login instead of breaking the layout
    console.error("[DashboardLayout] Error:", error);
    redirect("/login");
  }
}



