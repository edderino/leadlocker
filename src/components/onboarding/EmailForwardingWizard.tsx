"use client";

import { useEffect, useState } from "react";
import { Clipboard, Check } from "lucide-react";
import { cn } from "@/libs/utils";
import { AUTO_GMAIL_VERIFICATION_ENABLED } from "@/config/leadlocker";

export default function EmailForwardingWizard({ 
  inboundEmail,
  contactEmail 
}: { 
  inboundEmail: string;
  contactEmail?: string;
}) {
  const [provider, setProvider] = useState<string>("gmail");
  const [copied, setCopied] = useState(false);

  // Auto-detect provider based on contact email
  useEffect(() => {
    const email = contactEmail || (typeof window !== "undefined" ? localStorage.getItem("login_email") : "") || "";
    if (!email) return;

    if (email.includes("@gmail.com") || email.includes("@googlemail.com")) {
      setProvider("gmail");
    } else if (
      email.includes("@outlook.com") ||
      email.includes("@hotmail.com") ||
      email.includes("@live.com") ||
      email.includes("@msn.com")
    ) {
      setProvider("outlook");
    } else {
      setProvider("custom");
    }
  }, []);

  const copy = async () => {
    await navigator.clipboard.writeText(inboundEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const renderInstructions = () => {
    switch (provider) {
      case "gmail":
        if (!autoVerificationEnabled) {
          return (
            <div className="space-y-4">
              <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-300">
                  Gmail auto-verification is temporarily disabled. You'll receive instructions on how to forward manually.
                </p>
              </div>
              <Step n="1" text="Open Gmail on desktop (not mobile)." />
              <Step n="2" text='Click the gear icon → "See all settings".' />
              <Step n="3" text='Go to the tab "Forwarding and POP/IMAP".' />
              <Step n="4" text='Click "Add forwarding address".' />
              <Step n="5" text={`Paste this address: ${inboundEmail}`} highlight />
              <Step n="6" text="Click Continue → Proceed." />
              <Step n="7" text="Google will send a verification code to your LeadLocker address." />
              <Step n="8" text="You'll need to manually enter the code when you receive it." />
            </div>
          );
        }
        
        return (
          <div className="space-y-4">
            <Step n="1" text="Open Gmail on desktop (not mobile)." />
            <Step n="2" text='Click the gear icon → "See all settings".' />
            <Step n="3" text='Go to the tab "Forwarding and POP/IMAP".' />
            <Step n="4" text='Click "Add forwarding address".' />
            <Step n="5" text={`Paste this address: ${inboundEmail}`} highlight />
            <Step n="6" text="Click Continue → Proceed." />
            <Step n="7" text="Google will send a verification code to LeadLocker." />
            <Step n="8" text="Once we receive the code, we will auto-confirm it." />
          </div>
        );

      case "outlook":
        return (
          <div className="space-y-4">
            <Step n="1" text="Go to Outlook.com → Settings → View all Outlook settings." />
            <Step n="2" text='Navigate to "Mail" → "Forwarding".' />
            <Step n="3" text={`Enter this forwarding address: ${inboundEmail}`} highlight />
            <Step n="4" text="Turn ON 'Enable Forwarding'." />
            <Step n="5" text="Click Save." />
          </div>
        );

      default:
      case "custom":
        return (
          <div className="space-y-4">
            <Step
              n="1"
              text="Log in to your email hosting provider (Google Workspace, cPanel, GoDaddy, Zoho, etc)."
            />
            <Step n="2" text='Look for "Forwarding", "Routing", or "Email Rules".' />
            <Step n="3" text={`Add this destination address: ${inboundEmail}`} highlight />
            <Step n="4" text="Save changes." />
            <Step n="5" text="If forwarding needs verification, LeadLocker will auto-detect it." />
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 p-6 rounded-xl bg-neutral-900 border border-neutral-800 text-white">
      {/* Header */}
      <h2 className="text-2xl font-semibold">Email Forwarding Setup</h2>
      <p className="text-neutral-400">
        Choose your email provider and follow the steps to forward all new leads to LeadLocker.
      </p>

      {/* Provider Select */}
      <div className="flex gap-3">
        <ProviderButton selected={provider === "gmail"} onClick={() => setProvider("gmail")}>
          Gmail
        </ProviderButton>
        <ProviderButton selected={provider === "outlook"} onClick={() => setProvider("outlook")}>
          Outlook
        </ProviderButton>
        <ProviderButton selected={provider === "custom"} onClick={() => setProvider("custom")}>
          Custom Domain
        </ProviderButton>
      </div>

      {/* Forwarding Address Box */}
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-neutral-400 text-sm">Your forwarding address</p>
          <p className="font-mono text-lg">{inboundEmail}</p>
        </div>

        <button
          onClick={copy}
          className="p-2 rounded-md bg-neutral-700 hover:bg-neutral-600 transition"
        >
          {copied ? <Check size={18} /> : <Clipboard size={18} />}
        </button>
      </div>

      {/* Test Forwarding Button */}
      <button
        onClick={async () => {
          try {
            const res = await fetch("/api/client/send-test-email", {
              method: "POST",
              credentials: "include",
            });
            if (res.ok) {
              alert("Test email sent! When it arrives in LeadLocker, your status will update.");
            } else {
              alert("Failed to send test email. Please try again.");
            }
          } catch (err) {
            console.error(err);
            alert("Failed to send test email. Please try again.");
          }
        }}
        className="mt-4 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition"
      >
        Send Test Email
      </button>

      {/* Instructions */}
      <div className="mt-6">{renderInstructions()}</div>
    </div>
  );
}

function ProviderButton({
  selected,
  children,
  onClick,
}: {
  selected: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-md border transition",
        selected
          ? "bg-white text-black border-white"
          : "bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-white"
      )}
    >
      {children}
    </button>
  );
}

function Step({ n, text, highlight }: { n: string; text: string; highlight?: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-sm font-semibold">
        {n}
      </div>
      <p className={cn("text-neutral-200", highlight && "font-semibold text-white")}>{text}</p>
    </div>
  );
}

