"use client";

import { useRouter } from "next/navigation";

export default function OnboardingStep1() {
  const router = useRouter();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 1 — Connect Your Email</h2>
      <p className="text-gray-300 mb-4">
        To start receiving leads instantly, you'll forward your lead notifications to your unique LeadLocker address.
      </p>

      <div className="bg-black border border-zinc-700 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-400 mb-2">Your forwarding address:</p>
        <p className="font-mono text-lg break-all text-green-400">
          your-client@mg.leadlocker.app
        </p>
      </div>

      <p className="text-gray-400 text-sm mb-3">Choose your email provider:</p>

      <div className="space-y-3 mb-8">
        <a href="/help/gmail-forwarding" className="block w-full text-center bg-zinc-800 hover:bg-zinc-700 py-3 rounded-md transition">
          Gmail
        </a>
        <a href="/help/outlook-forwarding" className="block w-full text-center bg-zinc-800 hover:bg-zinc-700 py-3 rounded-md transition">
          Outlook / Hotmail
        </a>
        <a href="/help/iphone-forwarding" className="block w-full text-center bg-zinc-800 hover:bg-zinc-700 py-3 rounded-md transition">
          iPhone Mail App
        </a>
      </div>

      <button
        onClick={() => router.push("/onboarding/step2")}
        className="w-full bg-white text-black py-3 rounded-md font-medium hover:opacity-80 transition"
      >
        Continue
      </button>
    </div>
  );
}

