import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic"; // required for using cookies()

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  try {
    const cookieStore = await cookies();
    const sessionToken =
      cookieStore.get("ll_session")?.value ||
      cookieStore.get("sb-access-token")?.value ||
      null;

    if (!sessionToken) {
      return redirect("/login");
    }

    // Validate the session + get client
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return redirect("/login");
    }

    const data = await res.json();
    const client = data.client;

    // If no client found, redirect to login
    if (!client) {
      return redirect("/login");
    }

    // 🚧 BLOCK dashboard if onboarding not complete
    if (!client.onboarding_complete) {
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
