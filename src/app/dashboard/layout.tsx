import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Force dynamic rendering since we use cookies()
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Don't check cookies server-side - let the client-side page handle auth
  // This avoids timing issues where cookies aren't available immediately after login
  // The dashboard page will check /api/auth/me and redirect if needed
  return <>{children}</>;
}



