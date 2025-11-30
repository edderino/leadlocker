"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OnboardingStep3() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function finish() {
    if (!phone.trim()) {
      setError("Please enter your phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to complete setup");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Unexpected error — try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 3 — SMS Alerts</h2>
      <p className="text-gray-300 mb-6">
        Leads will be texted directly to you. Enter your mobile number below.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-900 text-red-300 border border-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="04XX XXX XXX"
        className="w-full p-3 bg-black border border-zinc-700 rounded-md text-white mb-6 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        disabled={loading}
      />

      <button
        onClick={finish}
        disabled={loading}
        className="w-full bg-white text-black py-3 rounded-md font-medium hover:opacity-80 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Completing..." : "Complete Setup"}
      </button>
    </div>
  );
}

