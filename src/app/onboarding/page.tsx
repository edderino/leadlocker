"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, ExternalLink } from "lucide-react";

type ForwardingStatus = {
  waitingForVerificationEmail: boolean;
  addressAdded: boolean;
  verificationClicked: boolean;
  forwardingEnabled: boolean;
  changesSaved: boolean;
  forwardingDisabled?: boolean;
  selfForwardingDetected?: boolean;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<1 | 2>(1);
  const [client, setClient] = useState<any>(null);
  const [status, setStatus] = useState<ForwardingStatus>({
    waitingForVerificationEmail: true,
    addressAdded: false,
    verificationClicked: false,
    forwardingEnabled: false,
    changesSaved: false,
  });

  // Fetch client data
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (data.client) {
          setClient(data.client);
        }
      } catch (err) {
        console.error("Failed to load client:", err);
      }
    }
    load();
  }, []);

  // Poll for forwarding status
  useEffect(() => {
    if (screen !== 2) return;

    let interval: ReturnType<typeof setInterval> | undefined;

    const checkStatus = async () => {
      try {
        const res = await fetch("/api/onboarding/forwarding-status", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        
        if (data.status) {
          setStatus(data.status);
          setClient(data.client || client);
          
          // If forwarding is fully enabled, mark onboarding complete
          if (data.status.forwardingEnabled && data.status.changesSaved && data.client?.forwarding_confirmed) {
            // Auto-complete after a short delay
            setTimeout(() => {
              router.push("/dashboard");
            }, 2000);
          }
        }
      } catch (err) {
        console.error("Status check error:", err);
      }
    };

    checkStatus();
    interval = setInterval(checkStatus, 5000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [screen, client, router]);

  const inboundEmail = client?.inbound_email || "yourcompanyname@mg.leadlocker.app";
  const gmailForwardingUrl = "https://mail.google.com/mail/u/0/#settings/fwdandpop";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {screen === 1 && (
          <Screen1 
            inboundEmail={inboundEmail}
            onContinue={() => setScreen(2)}
          />
        )}
        {screen === 2 && (
          <Screen2 
            client={client}
            status={status}
            inboundEmail={inboundEmail}
            gmailForwardingUrl={gmailForwardingUrl}
          />
        )}
      </div>
    </div>
  );
}

function Screen1({ inboundEmail, onContinue }: { inboundEmail: string; onContinue: () => void }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Forwarding Setup</h1>
      <p className="text-gray-400">Gmail has 3 steps. Follow them exactly or forwarding won't work.</p>
      <p className="text-sm text-gray-500">This takes under 60 seconds.</p>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">1. Open Gmail Forwarding Settings</h2>
          <a
            href="https://mail.google.com/mail/u/0/#settings/fwdandpop"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-md font-medium hover:bg-gray-200"
          >
            Open Gmail Forwarding
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">2. Add your LeadLocker address</h2>
          <p className="text-gray-300 mb-2">In Gmail, click <strong>Add a forwarding address</strong></p>
          <p className="text-gray-300 mb-3">Enter:</p>
          <code className="block bg-zinc-900 border border-zinc-700 px-4 py-3 rounded text-blue-300 font-mono text-sm">
            {inboundEmail}
          </code>
          <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-600/50 rounded">
            <p className="text-yellow-200 text-sm font-bold">⚠️ Warning:</p>
            <p className="text-yellow-100 text-sm">
              Gmail cannot forward from the SAME address you're forwarding to. Use a different sending address for your leads.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">3. Complete Gmail's 2-step verification</h2>
          <p className="text-gray-300">Gmail will ask twice:</p>
          <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
            <li>Verify the forwarding address</li>
            <li>Enable forwarding</li>
          </ul>
          <p className="text-gray-300 mt-2">After enabling forwarding, scroll down and click <strong>Save Changes</strong>.</p>
        </div>
      </div>

      <button
        onClick={onContinue}
        className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-md font-semibold hover:bg-gray-200 mt-8"
      >
        Continue
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function Screen2({ 
  client, 
  status, 
  inboundEmail, 
  gmailForwardingUrl 
}: { 
  client: any; 
  status: ForwardingStatus; 
  inboundEmail: string;
  gmailForwardingUrl: string;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Live Forwarding Status</h1>

      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 space-y-3">
        <StatusItem 
          checked={status.addressAdded || status.waitingForVerificationEmail}
          label="Waiting for Gmail's verification email…"
        />
        <StatusItem 
          checked={status.addressAdded}
          label="Address added"
        />
        <StatusItem 
          checked={status.verificationClicked}
          label="Verification clicked"
        />
        <StatusItem 
          checked={status.forwardingEnabled}
          label="Forwarding enabled"
        />
        <StatusItem 
          checked={status.changesSaved}
          label="Changes saved"
        />
      </div>

      {/* Forwarding added but disabled */}
      {status.forwardingDisabled && status.addressAdded && !status.forwardingEnabled && (
        <div className="bg-orange-900/30 border border-orange-600/50 rounded-lg p-4">
          <p className="text-orange-200 font-semibold mb-2">🔶 Forwarding is added but not enabled.</p>
          <p className="text-orange-100 text-sm mb-3">
            Go back to Gmail → turn on <strong>Forward a copy to {inboundEmail}</strong>
          </p>
          <p className="text-orange-100 text-sm mb-3">Scroll down → <strong>Save changes</strong>.</p>
          <a
            href={gmailForwardingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-orange-700"
          >
            Open Gmail Forwarding Again
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Self-forwarding detected */}
      {status.selfForwardingDetected && (
        <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4">
          <p className="text-red-200 font-semibold mb-2">❌ Gmail will not forward emails you send from the same address you're forwarding from.</p>
          <p className="text-red-100 text-sm">
            Send your leads from a different email address or use your business inbox.
          </p>
        </div>
      )}

      {/* Success state */}
      {status.forwardingEnabled && status.changesSaved && client?.forwarding_confirmed && (
        <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-4">
          <p className="text-green-200 font-semibold">✅ Forwarding is active!</p>
          <p className="text-green-100 text-sm mt-2">Redirecting to dashboard...</p>
        </div>
      )}
    </div>
  );
}

function StatusItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
        checked ? "bg-white border-white" : "border-gray-600"
      }`}>
        {checked && <Check className="w-3 h-3 text-black" />}
      </div>
      <span className={checked ? "text-white" : "text-gray-400"}>{label}</span>
    </div>
  );
}
