"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function GmailForwardingPage() {
  const router = useRouter();
  const [inboundEmail, setInboundEmail] = useState("yourname@mg.leadlocker.app");

  useEffect(() => {
    // Try to get inbound email from localStorage or fetch from API
    const stored = localStorage.getItem("ll_inbound_email");
    if (stored) {
      setInboundEmail(stored);
    } else {
      // Fetch from API if not in localStorage
      fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.client?.inbound_email) {
            setInboundEmail(data.client.inbound_email);
            localStorage.setItem("ll_inbound_email", data.client.inbound_email);
          }
        })
        .catch(() => {
          // Fallback to default
        });
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-start px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Set Up Gmail Forwarding</h1>

      <p className="text-gray-300 text-lg max-w-2xl text-center mb-10">
        Follow these steps to forward your leads directly into LeadLocker.
        This takes less than 2 minutes.
      </p>

      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 max-w-2xl w-full">
        <ol className="space-y-6 text-gray-200 text-lg">
          <li>
            1. Open Gmail and click the <strong>⚙️ Settings</strong> icon.
          </li>
          <li>
            2. Click <strong>"See all settings"</strong>.
          </li>
          <li>
            3. Go to the <strong>"Forwarding and POP/IMAP"</strong> tab.
          </li>
          <li>
            4. Click <strong>"Add a forwarding address"</strong>.
          </li>
          <li>
            5. Enter your LeadLocker address:
            <br />
            <span className="text-green-400 font-mono mt-2 inline-block">
              {inboundEmail}
            </span>
          </li>
          <li>
            6. Gmail will send a verification email to LeadLocker.
            We'll auto-detect it and verify the forwarding address.
          </li>
        </ol>
      </div>

      <button
        onClick={() => router.push("/onboarding")}
        className="mt-12 px-8 py-4 rounded-lg bg-green-500 text-black font-bold text-lg hover:bg-green-400"
      >
        Back to Onboarding
      </button>
    </div>
  );
}

