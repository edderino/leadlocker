import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies(); // ← FIXED (must await in Next.js 15!)

  const token =
    cookieStore.get("sb-access-token")?.value ||
    cookieStore.get("ll_session")?.value ||
    null;

  // 🚫 DO NOT redirect here.
  // Just render the children — onboarding/dashboard pages themselves handle auth on the client.
  return (
    <section className="h-screen w-full overflow-hidden">
      {children}
    </section>
  );
}
