"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, ExternalLink, Mail, AlertCircle } from "lucide-react";

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
          // Auto-advance to screen 2 if verification email detected
          if (data.client.gmail_forwarding_code && screen === 1) {
            setScreen(2);
          }
        }
      } catch (err) {
        console.error("Failed to load client:", err);
      }
    }
    load();
  }, [screen]);

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
  const verificationLink = client?.gmail_forwarding_code;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c0f15] via-[#161b22] to-[#0c0f15] text-white flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-3xl">
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
            verificationLink={verificationLink}
          />
        )}
      </div>
    </div>
  );
}

function Screen1({ inboundEmail, onContinue }: { inboundEmail: string; onContinue: () => void }) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Forwarding Setup
        </h1>
        <p className="text-gray-400 text-lg">Gmail has 3 steps. Follow them exactly or forwarding won't work.</p>
        <p className="text-sm text-gray-500 mt-2">This takes under 60 seconds.</p>
      </div>

      <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-8 space-y-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">1</div>
            <h2 className="text-xl font-semibold">Open Gmail Forwarding Settings</h2>
          </div>
          <a
            href="https://mail.google.com/mail/u/0/#settings/fwdandpop"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg"
          >
            Open Gmail Forwarding
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="border-t border-zinc-800 pt-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">2</div>
            <h2 className="text-xl font-semibold">Add your LeadLocker address</h2>
          </div>
          <p className="text-gray-300 ml-11">In Gmail, click <strong className="text-white">Add a forwarding address</strong></p>
          <p className="text-gray-300 ml-11">Enter:</p>
          <div className="ml-11">
            <code className="block bg-zinc-950 border border-zinc-700 px-4 py-3 rounded-lg text-blue-300 font-mono text-sm">
              {inboundEmail}
            </code>
          </div>
          <div className="ml-11 mt-4 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-200 text-sm font-semibold mb-1">Important Warning</p>
                <p className="text-yellow-100 text-sm">
                  Gmail cannot forward from the SAME address you're forwarding to. Use a different sending address for your leads.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">3</div>
            <h2 className="text-xl font-semibold">Complete Gmail's 2-step verification</h2>
          </div>
          <p className="text-gray-300 ml-11">Gmail will ask twice:</p>
          <ul className="list-disc list-inside text-gray-300 ml-11 space-y-1">
            <li>Verify the forwarding address</li>
            <li>Enable forwarding</li>
          </ul>
          <p className="text-gray-300 ml-11 mt-2">After enabling forwarding, scroll down and click <strong className="text-white">Save Changes</strong>.</p>
        </div>
      </div>

      <button
        onClick={onContinue}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
      >
        Continue to Status Check
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function Screen2({ 
  client, 
  status, 
  inboundEmail, 
  gmailForwardingUrl,
  verificationLink
}: { 
  client: any; 
  status: ForwardingStatus; 
  inboundEmail: string;
  gmailForwardingUrl: string;
  verificationLink?: string | null;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Live Forwarding Status
        </h1>
        <p className="text-gray-400">We're monitoring your Gmail forwarding setup in real-time</p>
      </div>

      <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-8 space-y-4">
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

      {/* Verification Link */}
      {verificationLink && typeof verificationLink === "string" && verificationLink.startsWith("http") && !status.verificationClicked && (
        <div className="bg-blue-900/20 border border-blue-600/30 rounded-xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <Mail className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-200 mb-2">Gmail Verification Required</h3>
              <p className="text-blue-100 text-sm mb-4">
                We received Google's verification email. Click below to open the Gmail verification page and complete the setup.
              </p>
              <a
                href={verificationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg"
              >
                Click here to verify Gmail forwarding
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div className="mt-4 p-4 bg-zinc-950/50 rounded-lg border border-zinc-800">
            <p className="text-gray-300 text-sm mb-2 font-semibold">What to do in Gmail:</p>
            <ol className="list-decimal list-inside text-gray-400 text-sm space-y-1">
              <li>Click the verification link above</li>
              <li>In Gmail settings, click <strong className="text-white">Verify</strong> next to your LeadLocker address</li>
              <li>Turn on <strong className="text-white">Forward a copy</strong> toggle</li>
              <li>Scroll down and click <strong className="text-white">Save Changes</strong></li>
            </ol>
          </div>
        </div>
      )}

      {/* Forwarding added but disabled */}
      {status.forwardingDisabled && status.addressAdded && !status.forwardingEnabled && (
        <div className="bg-orange-900/20 border border-orange-600/30 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="text-orange-200 font-semibold mb-2 text-lg">Forwarding is added but not enabled</p>
              <p className="text-orange-100 text-sm mb-3">
                Go back to Gmail → turn on <strong>Forward a copy to {inboundEmail}</strong>
              </p>
              <p className="text-orange-100 text-sm mb-4">Scroll down → <strong>Save changes</strong>.</p>
              <a
                href={gmailForwardingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors shadow-lg"
              >
                Open Gmail Forwarding Again
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Self-forwarding detected */}
      {status.selfForwardingDetected && (
        <div className="bg-red-900/20 border border-red-600/30 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="text-red-200 font-semibold mb-2 text-lg">Self-Forwarding Detected</p>
              <p className="text-red-100 text-sm">
                Gmail will not forward emails you send from the same address you're forwarding from. Send your leads from a different email address or use your business inbox.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success state */}
      {status.forwardingEnabled && status.changesSaved && client?.forwarding_confirmed && (
        <div className="bg-green-900/20 border border-green-600/30 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <Check className="w-6 h-6 text-green-400" />
            <div>
              <p className="text-green-200 font-semibold text-lg">✅ Forwarding is active!</p>
              <p className="text-green-100 text-sm mt-1">Redirecting to dashboard...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all ${
        checked 
          ? "bg-gradient-to-br from-blue-500 to-purple-500 border-transparent shadow-lg" 
          : "border-zinc-600 bg-zinc-950"
      }`}>
        {checked && <Check className="w-4 h-4 text-white" />}
      </div>
      <span className={`text-base transition-colors ${checked ? "text-white font-medium" : "text-gray-400"}`}>
        {label}
      </span>
    </div>
  );
}
