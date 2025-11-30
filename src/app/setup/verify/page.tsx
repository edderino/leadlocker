"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyForwardingPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitCode() {
    if (!code.trim()) {
      setStatus("Please enter a code");
      return;
    }

    setLoading(true);
    setStatus("Submitting...");

    try {
      const res = await fetch("/api/forwarding/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (data.ok) {
        setStatus("✔ Forwarding successfully verified!");
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        setStatus(data.error || "❌ Invalid code. Try again.");
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Error submitting code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">Enter Your Verification Code</h1>
        <p className="text-gray-400 mb-6 text-center">
          Enter the 6-digit code that Gmail sent to your LeadLocker forwarding address.
        </p>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="bg-gray-900 border border-gray-700 px-4 py-3 rounded-md w-full mb-4 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="123456"
          maxLength={6}
          disabled={loading}
        />

        <button
          onClick={submitCode}
          disabled={loading || code.length !== 6}
          className="w-full px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : "Submit Code"}
        </button>

        {status && (
          <p className={`mt-4 text-center ${status.includes("✔") ? "text-green-400" : "text-red-400"}`}>
            {status}
          </p>
        )}

        <a
          href="/setup"
          className="block mt-6 text-center text-gray-400 hover:text-white underline text-sm"
        >
          ← Back to Setup Instructions
        </a>
      </div>
    </div>
  );
}

