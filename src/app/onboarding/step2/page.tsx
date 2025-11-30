"use client";

import { useRouter } from "next/navigation";

export default function OnboardingStep2() {
  const router = useRouter();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 2 — Confirm Forwarding</h2>
      <p className="text-gray-300 mb-6">
        Once forwarding is turned on, LeadLocker will begin scanning incoming leads automatically.
      </p>

      <p className="text-gray-400 text-sm mb-3">When you're done, click continue:</p>

      <button
        onClick={() => router.push("/onboarding/step3")}
        className="w-full bg-white text-black py-3 rounded-md font-medium hover:opacity-80 transition"
      >
        Continue
      </button>
    </div>
  );
}

