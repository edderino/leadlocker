"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, ExternalLink, Mail, AlertCircle, ChevronLeft } from "lucide-react";

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
  const [currentSubStep, setCurrentSubStep] = useState(1);
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
          // Auto-advance to step 2 if verification email detected (after adding address)
          if (data.client.gmail_forwarding_code && currentSubStep === 1) {
            setCurrentSubStep(2);
          }
        }
      } catch (err) {
        console.error("Failed to load client:", err);
      }
    }
    load();
  }, [currentSubStep]);

  // Poll for verification link (after address is added)
  useEffect(() => {
    if (currentSubStep !== 1) return;

    let interval: ReturnType<typeof setInterval> | undefined;

    const checkForVerificationLink = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (data.client?.gmail_forwarding_code) {
          setClient(data.client);
          // Auto-advance to step 2 when verification link appears
          setCurrentSubStep(2);
        }
      } catch (err) {
        console.error("Failed to check for verification link:", err);
      }
    };

    checkForVerificationLink();
    interval = setInterval(checkForVerificationLink, 3000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSubStep]);

  // Poll for forwarding status (starting from step 2 to detect verification + forwarding toggle/save, and step 6 to detect test email)
  useEffect(() => {
    if (currentSubStep < 2) return;

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
          
          // Auto-advance to step 5 when forwarding is enabled (after toggle + save)
          // Note: forwardingEnabled is only true after test email arrives, so this won't auto-advance
          // Users will manually advance through steps 3-5
          
          // Auto-advance to step 6 when test email is detected (forwarding confirmed)
          if (data.status.forwardingEnabled && data.status.changesSaved && currentSubStep === 5) {
            setCurrentSubStep(6);
          }
          
          // Auto-advance to dashboard when forwarding confirmed
          if (data.status.forwardingEnabled && data.status.changesSaved && data.client?.forwarding_confirmed && currentSubStep === 6) {
            // Mark onboarding as complete before redirecting
            try {
              await fetch("/api/onboarding/complete", {
                method: "POST",
                credentials: "include",
              });
            } catch (err) {
              console.error("Failed to mark onboarding complete:", err);
            }
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
    interval = setInterval(checkStatus, 3000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSubStep, client, router]);

  const inboundEmail = client?.inbound_email || "yourcompanyname@mg.leadlocker.app";
  const verificationLink = client?.gmail_forwarding_code;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c0f15] via-[#161b22] to-[#0c0f15] text-white flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded transition-all ${
                  i <= currentSubStep ? "bg-blue-500" : "bg-gray-700"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-400 text-center">
            Step {currentSubStep} of 6
          </p>
        </div>

        {/* Step Content */}
        {currentSubStep === 1 && (
          <StepCard
            number={1}
            title="Add forwarding address in Gmail"
            action={
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg"
              >
                Open Gmail →
                <ExternalLink className="w-4 h-4" />
              </a>
            }
            instruction={
              <>
                Go to: Settings → See all settings → Forwarding and POP/IMAP tab
                <br />
                Click <strong className="text-yellow-200">"Add forwarding address"</strong>
                <br />
                Paste this address: <code className="bg-black/40 px-2 py-1 rounded text-yellow-300 font-mono">{inboundEmail}</code>
                <br />
                Click Continue → Proceed
                <br />
                <br />
                Gmail will send a verification email to LeadLocker. We'll detect it automatically!
              </>
            }
            image="/onboarding/gmail-settings.png"
            imageAlt="Gmail forwarding settings page"
            onComplete={() => setCurrentSubStep(2)}
            waitingMessage="⏳ Waiting for Gmail to send the verification email... We'll detect it automatically"
            autoDetect={true}
          />
        )}

        {currentSubStep === 2 && (
          <StepCard
            number={2}
            title="Click the verification link and Confirm"
            action={
              verificationLink && typeof verificationLink === "string" && verificationLink.startsWith("http") ? (
                <a
                  href={verificationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg"
                >
                  Open your Gmail verification link →
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <div className="text-yellow-400 text-sm">
                  ⏳ Waiting for Gmail to send the verification email...
                </div>
              )
            }
            instruction={
              <>
                1. Click the big blue button above to open your <strong>Gmail verification link</strong>.
                <br />
                2. In Gmail, press <strong>Confirm</strong> on the popup.
                <br />
                <br />
                The page will say: <em>Please confirm forwarding mail of your business email to your Lead Locker address.</em>
                <br />
                <br />
                <strong className="text-yellow-200">
                  You must press Confirm in Gmail or forwarding will not work.
                </strong>
              </>
            }
            image="/onboarding/gmail-confirmation.png"
            imageAlt="Gmail forwarding confirmation page"
            onComplete={() => setCurrentSubStep(3)}
            onBack={() => setCurrentSubStep(1)}
            completed={status.verificationClicked || !!verificationLink}
            disabled={!verificationLink}
            autoDetect={true}
            waitingMessage="Once Gmail sends the verification email to LeadLocker, this step will unlock automatically (can take up to 30 seconds)."
          />
        )}

        {currentSubStep === 3 && (
          <StepCard
            number={3}
            title="⚠️ Turn ON 'Forward a copy' toggle"
            critical={true}
            instruction={
              <>
                Find your LeadLocker address: <code className="bg-black/40 px-2 py-1 rounded text-yellow-300 font-mono">{inboundEmail}</code>
                <br />
                Make sure the toggle/checkbox is <strong className="text-yellow-200">ON</strong>
                <br />
                <br />
                <strong className="text-yellow-200">Important:</strong> After making changes, close the Gmail tab and reopen it to confirm it's set properly.
                <br />
                <br />
                You must see the pink banner to confirm.
              </>
            }
            image="/onboarding/forwarding-toggle-on.png"
            imageAlt="Gmail forwarding toggle in ON position"
            onComplete={() => {
              setCurrentSubStep(4);
            }}
            onBack={() => setCurrentSubStep(2)}
            completed={status.forwardingEnabled}
            autoDetect={true}
          />
        )}

        {currentSubStep === 4 && (
          <StepCard
            number={4}
            title="⚠️ Scroll down → Click 'Save Changes'"
            critical={true}
            instruction="This button is at the bottom of the Gmail settings page"
            warning="If you skip this, forwarding won't work!"
            image="/onboarding/save-changes.png"
            imageAlt="Save Changes button location"
            onComplete={() => {
              setCurrentSubStep(5);
            }}
            onBack={() => setCurrentSubStep(3)}
            completed={status.changesSaved}
          />
        )}

        {currentSubStep === 5 && (
          <StepCard
            number={5}
            title="✅ Check for pink banner"
            instruction={
              <>
                After saving, a <strong className="text-pink-300">pink banner</strong> should appear at the top.
                <br />
                It says: "You are forwarding your email to {inboundEmail}..."
              </>
            }
            image="/onboarding/pink-banner.png"
            imageAlt="Pink banner confirming forwarding is active"
            helpText="No pink banner? Go back to step 3 and make sure forwarding is ON"
            onComplete={() => setCurrentSubStep(6)}
            onBack={() => setCurrentSubStep(4)}
            completed={status.forwardingEnabled && status.changesSaved}
          />
        )}

        {currentSubStep === 6 && (
          <StepCard
            number={6}
            title="Send a Test Email"
            instruction={
              <>
                Send a test email to your business inbox: <code className="bg-black/40 px-2 py-1 rounded text-purple-300 font-mono">{client?.contact_email || "your-business-email@example.com"}</code>
                <br />
                Gmail will forward it to LeadLocker automatically.
              </>
            }
            action={
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!client?.contact_email) return;
                  
                  const emailBody = `Hi there,

I'm looking to get a quote for some electrical work at my property.

Job details:
- Install 3 new power points in the kitchen
- Replace old light switches with dimmer switches (5 switches)
- Install outdoor security lighting at front and back

Property is a 3-bedroom house. Looking to get this done in the next 2-3 weeks if possible.

Please let me know your availability and an estimated quote.

You can reach me on 0400 123 456.

Thanks!`;
                  
                  const subject = encodeURIComponent("Quote Request - Electrical Work");
                  const body = encodeURIComponent(emailBody);
                  const to = encodeURIComponent(client.contact_email);
                  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
                  
                  window.open(gmailUrl, "_blank", "noopener,noreferrer");
                }}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg"
              >
                Send test email →
                <ExternalLink className="w-4 h-4" />
              </button>
            }
            onComplete={() => {
              // Auto-advance handled by polling
            }}
            onBack={() => setCurrentSubStep(5)}
            completed={client?.forwarding_confirmed}
            autoDetect={true}
            waitingMessage="⏳ Waiting for your test email to arrive... We'll detect it automatically"
          />
        )}
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  action,
  instruction,
  visualHint,
  warning,
  helpText,
  critical,
  onComplete,
  onBack,
  completed,
  autoDetect,
  disabled,
  image,
  imageAlt,
  waitingMessage,
}: {
  number: number;
  title: string;
  action?: React.ReactNode;
  instruction: React.ReactNode;
  visualHint?: string;
  warning?: string;
  helpText?: string;
  critical?: boolean;
  onComplete: () => void;
  onBack?: () => void;
  completed?: boolean;
  autoDetect?: boolean;
  disabled?: boolean;
  image?: string;
  imageAlt?: string;
  waitingMessage?: string;
}) {
  return (
    <div
      className={`p-6 rounded-lg border-2 ${
        critical
          ? "bg-yellow-900/30 border-yellow-500/50"
          : "bg-gray-900/40 border-gray-800"
      }`}
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
            completed
              ? "bg-green-600"
              : critical
              ? "bg-yellow-500 text-black"
              : "bg-blue-600"
          }`}
        >
          {completed ? <Check className="w-5 h-5" /> : number}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          {action && <div className="mb-3">{action}</div>}
          <p className="text-gray-300 mb-2">{instruction}</p>
          {visualHint && (
            <div className="bg-black/40 p-2 rounded text-sm text-gray-400 mb-2">
              {visualHint}
            </div>
          )}
          {warning && (
            <div className="bg-red-900/30 p-2 rounded text-sm text-red-200 mb-2">
              ⚠️ {warning}
            </div>
          )}
          {helpText && (
            <p className="text-sm text-yellow-300 mt-2">{helpText}</p>
          )}
          {image && (
            <div className="mt-4 rounded-lg overflow-hidden border border-gray-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={imageAlt || "Gmail settings"}
                className="w-full h-auto"
                onError={(e) => {
                  // Hide image if it fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      </div>

      {waitingMessage && !completed && (
        <p className="text-xs text-gray-500 mb-3 text-center">{waitingMessage}</p>
      )}

      <div className="flex gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex-1 bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        )}
        <button
          onClick={onComplete}
          disabled={disabled}
          className={`${onBack ? 'flex-1' : 'w-full'} bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {completed ? "✓ Done" : "I did this →"}
        </button>
      </div>

      {autoDetect && !completed && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          We're checking automatically... (or click above if done)
        </p>
      )}
    </div>
  );
}
