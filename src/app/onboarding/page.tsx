import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic"; // required for reading cookies

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get("ll_session")?.value ||
    cookieStore.get("sb-access-token")?.value ||
    null;

  if (!sessionToken) {
    return redirect("/login");
  }

  // Validate session + load client
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

  // If onboarding already complete → go to dashboard
  if (client.onboarding_complete) {
    return redirect("/dashboard");
  }

  // Prepare onboarding data
  const forwardingAddress = client.inbound_email; // e.g., edco@mg.leadlocker.app
  const firstName = client.owner_name?.split(" ")[0] ?? client.owner_name;

  return (
    <main className="min-h-screen bg-black text-white p-6 flex flex-col items-center">
      <div className="w-full max-w-xl mt-10">
        <h1 className="text-3xl font-bold mb-4">
          Welcome, {firstName}! 👋
        </h1>
        <p className="text-gray-300 mb-8">
          Before your dashboard is ready, we just need to set up your email
          forwarding so new enquiries instantly turn into Leads + SMS alerts.
        </p>

        {/* --- Onboarding Steps Placeholder (UI comes in next steps) --- */}

        <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-5">
          <p className="text-lg font-semibold mb-2">
            Your unique LeadLocker forwarding address:
          </p>

          <div className="bg-neutral-800 px-4 py-3 rounded-lg font-mono text-sm break-all">
            {forwardingAddress}
          </div>

          <p className="text-gray-400 mt-4 text-sm">
            You'll need this in step 2 when setting up your forwarding rules.
          </p>
        </div>

        <div className="mt-10 text-gray-400 text-sm">
          You'll be guided step-by-step next.
        </div>
      </div>
    </main>
  );
}
