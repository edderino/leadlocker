"use client";

import { useEffect, useState } from "react";

export default function SetupPage() {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (data.client) {
          setClient(data.client);
        }
      } catch (err) {
        console.error("Failed to load client:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-black text-white flex items-center justify-center">
        Loading setup...
      </div>
    );
  }

  if (!client) {
    return (
      <div className="w-full min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Please log in to view setup instructions.</p>
          <a href="/login" className="text-blue-400 underline">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const inboundEmail = client.inbound_email || `${client.slug}@mg.leadlocker.app`;

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">📨 Set Up Email Forwarding</h1>
        <p className="text-gray-300 mb-8">
          Follow these quick steps to forward all your enquiry emails to LeadLocker.
        </p>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Copy Your LeadLocker Forwarding Email</h2>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 flex justify-between items-center">
              <span className="font-mono text-sm break-all">{inboundEmail}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inboundEmail);
                  alert("Copied to clipboard!");
                }}
                className="px-3 py-1 bg-blue-600 rounded-md hover:bg-blue-500 transition"
              >
                Copy
              </button>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Open Gmail Settings</h2>
            <p className="text-gray-400 mb-3">
              Click this link to open Gmail forwarding settings:
            </p>
            <a
              href="https://mail.google.com/mail/u/0/#settings/fwdandpop"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-white text-black rounded-md font-semibold hover:bg-gray-200 transition"
            >
              Open Gmail Settings
            </a>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Add Forwarding Address</h2>
            <p className="text-gray-400">
              In Gmail → Forwarding & POP/IMAP → Click "Add a forwarding address"
              and paste the email you copied above.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Gmail Will Send a Confirmation Code</h2>
            <p className="text-gray-400">
              A verification email will be sent to your LeadLocker address and will appear in your inbox here.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Enter the Code Below</h2>
            <p className="text-gray-400 mb-3">
              When you receive Gmail's verification code, you'll enter it on the next screen.
            </p>
            <a
              href="/setup/verify"
              className="inline-block px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 transition"
            >
              Enter Verification Code →
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}

