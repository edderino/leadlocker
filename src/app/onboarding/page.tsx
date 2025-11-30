"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [forwarding, setForwarding] = useState("edco@mg.leadlocker.app");
  const [loading, setLoading] = useState(true);

  // Fetch client data to get the actual forwarding address
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (data.client?.inbound_email) {
          setForwarding(data.client.inbound_email);
        }
      } catch (err) {
        console.error("Failed to load client:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(forwarding);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-10">
      <h1 className="text-3xl font-bold mb-6">Set Up Email Forwarding</h1>
      <p className="text-gray-300 max-w-xl text-center mb-10">
        To receive leads inside LeadLocker, you need to forward your emails to your unique LeadLocker address.
      </p>

      <div className="bg-zinc-900 p-6 rounded-xl w-full max-w-xl mb-10 border border-zinc-700">
        <h2 className="text-xl font-semibold mb-3">Your forwarding email</h2>
        <div className="flex items-center justify-between bg-black p-4 rounded border border-zinc-600">
          <span className="font-mono text-sm break-all">{forwarding}</span>
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 p-6 rounded-xl w-full max-w-xl border border-zinc-700">
        <h2 className="text-xl font-semibold mb-4">Gmail Instructions</h2>
        <ol className="list-decimal list-inside space-y-3 text-gray-300">
          <li>Open Gmail on desktop.</li>
          <li>Click ⚙️ <strong>Settings</strong> → <strong>See all settings</strong>.</li>
          <li>Go to the <strong>Forwarding and POP/IMAP</strong> tab.</li>
          <li>Click <strong>Add a forwarding address</strong>.</li>
          <li>Paste your LeadLocker email above.</li>
          <li>Gmail will send a confirmation code to LeadLocker.</li>
          <li>We automatically detect the code.</li>
          <li>Click the button below once you've done this.</li>
        </ol>

        <button
          onClick={async () => {
            try {
              const res = await fetch("/api/onboarding/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
              });
              
              if (res.ok) {
                window.location.href = "/dashboard";
              } else {
                alert("Failed to complete onboarding. Please try again.");
              }
            } catch (err) {
              console.error(err);
              alert("Error completing onboarding. Please try again.");
            }
          }}
          className="mt-8 w-full py-3 bg-white text-black rounded-lg font-bold hover:bg-gray-200 transition"
        >
          I've completed forwarding
        </button>
      </div>
    </div>
  );
}
