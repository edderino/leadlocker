import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read session/access cookie
  const cookieStore = await cookies();
  const token =
    cookieStore.get("ll_session")?.value ||
    cookieStore.get("sb-access-token")?.value;

  if (!token) {
    // No session cookie → kick them to login
    redirect("/login");
  }

  // Validate token via auth/me API
  const res = await fetch("/api/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok || !data?.client) {
    // Bad/expired token → redirect to login
    redirect("/login");
  }

  const user = data.client;

  // If we get here → user is valid
  return (
    <section className="min-h-screen bg-gray-50">
      <DashboardNav user={user} />
      <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>
    </section>
  );
}



