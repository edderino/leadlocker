"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Mail } from "lucide-react";
import Link from "next/link";

type ForwardingStatus = "not-connected" | "waiting" | "connected";

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [client, setClient] = useState<any>(null);
  const [status, setStatus] = useState<ForwardingStatus>("not-connected");
  const [checking, setChecking] = useState(false);

  // Fetch client data to get inbound_email and store in localStorage
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
          if (data.client.inbound_email) {
            localStorage.setItem("ll_inbound_email", data.client.inbound_email);
          }
          if (data.client.forwarding_confirmed) {
            setStatus("connected");
          }
        }
      } catch (err) {
        console.error("Failed to load client:", err);
      }
    }
    load();
  }, []);

  // Real-time polling to detect when forwarding starts working
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    const fetchClient = async () => {
      setChecking(true);

      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();

        if (data.client) {
          setClient(data.client);

          // If we've seen the Gmail verification email, move to Step 2
          if (data.client.gmail_forwarding_code && step < 2) {
            setStep(2);
          }

          // If forwarding is confirmed, move to Step 3
          if (data.client.forwarding_confirmed) {
            setStatus("connected");
            if (step < 3) {
              setStep(3);
            }
            if (interval) {
              clearInterval(interval);
            }
            return; // Don't keep polling
          } else {
            setStatus("waiting");
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }

      setChecking(false);
    };

    // Initial load
    fetchClient();

    // Poll every 5 sec
    interval = setInterval(fetchClient, 5000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [router, step]);

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center px-6 py-16">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">Let's Get You Set Up</h1>
        <p className="text-gray-400 mt-2">
          Follow these quick steps to start collecting leads instantly.
        </p>
      </div>


      {/* Forwarding status display */}
      <div className="mb-8 text-sm text-gray-300">
        {status === "not-connected" && (
          <p>
            ❌ Forwarding not connected yet. Follow the steps below in order — you
            only have to do this once.
          </p>
        )}
        {status === "waiting" && (
          <p>
            ⏳ We&apos;re watching for the very first email that Gmail forwards to
            LeadLocker. As soon as we see it, your setup will be marked as
            connected.
          </p>
        )}
        {status === "connected" && (
          <p className="text-green-400 text-base">
            ✅ Forwarding is active. Any new enquiry Gmail forwards to your
            LeadLocker address will become a lead and trigger an SMS.
          </p>
        )}
      </div>

      {/* Step Indicator */}
      <div className="flex items-center space-x-6 mb-12">
        <StepBubble number={1} active={step === 1} completed={step > 1} />
        <StepLine completed={step > 1} />
        <StepBubble number={2} active={step === 2} completed={step > 2} />
        <StepLine completed={step > 2} />
        <StepBubble number={3} active={step === 3} completed={step > 3} />
        <StepLine completed={step > 3} />
        <StepBubble number={4} active={step === 4} completed={false} />
      </div>

      {/* Panels */}
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-xl p-8 shadow-2xl">
        {step === 1 && <Step1 client={client} next={next} />}
        {step === 2 && <Step2 client={client} next={next} prev={prev} />}
        {step === 3 && <Step3 client={client} next={next} prev={prev} />}
        {step === 4 && <Step4 client={client} prev={prev} />}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   STEP UI COMPONENTS
------------------------------------------------------- */

function Step1({ client, next }: { client: any; next: () => void }) {
  return (
    <>
      <h2 className="text-2xl font-semibold mb-4">1. Forward Your Emails</h2>
      <p className="text-gray-300 mb-6">
        LeadLocker needs your leads forwarded to your unique LeadLocker email.
        This lets us capture every incoming lead instantly.
      </p>
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium mb-2">We detected you're using Gmail</h3>
        <p className="text-gray-400 mb-4">
          Click below for step-by-step instructions on how to forward emails.
        </p>
        <Link
          href="/onboarding/gmail"
          className="inline-flex items-center bg-white text-black px-5 py-3 rounded-md font-medium hover:bg-gray-200"
        >
          <Mail className="w-5 h-5 mr-2" />
          Set up Gmail Forwarding
        </Link>
      </div>
      <button
        onClick={next}
        className="flex items-center bg-white text-black px-5 py-3 rounded-md font-semibold hover:bg-gray-200"
      >
        Continue
        <ChevronRight className="w-5 h-5 ml-2" />
      </button>
    </>
  );
}

function Step2({
  client,
  next,
  prev,
}: {
  client: any;
  next: () => void;
  prev: () => void;
}) {
  const verificationLink = client?.gmail_forwarding_code;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-4">2. Verify Gmail Forwarding</h2>
      <div className="space-y-4 p-6 bg-gray-900/40 rounded-lg border border-gray-800">
        {verificationLink && typeof verificationLink === "string" && verificationLink.startsWith("http") ? (
          <>
            <p className="text-gray-300">
              We received Google's verification email. Click below to open the Gmail verification page:
            </p>
            <a
              href={verificationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-blue-400 underline hover:text-blue-300"
            >
              Click here to open Gmail verification →
            </a>
            <ol className="text-gray-400 text-sm space-y-1 mt-3 list-decimal list-inside">
              <li>Open Gmail.</li>
              <li>Click the gear icon → <strong>See all settings</strong>.</li>
              <li>Go to the <strong>Forwarding and POP/IMAP</strong> tab.</li>
              <li>Next to your LeadLocker address, click <strong>Verify</strong>.</li>
              <li>
                If verification doesn&apos;t show after finalising the verification, refresh the page, ensure your LeadLocker address is in the forwarding box, scroll to the bottom of the page in Gmail and save changes. A pink banner should then show at the top of the page saying &quot;You are forwarding your email to {client?.inbound_email || "yourcompanyname@mg.leadlocker.app"}. This notice will end in 7 days&quot;
              </li>
            </ol>
            <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
              <p className="text-yellow-200 text-sm font-semibold mb-2">⚠️ Important:</p>
              <p className="text-yellow-100 text-sm">
                If you&apos;re having trouble, double-check that:
              </p>
              <ul className="text-yellow-100 text-sm mt-2 list-disc list-inside space-y-1">
                <li>The <strong>pink banner</strong> is visible at the top of your Gmail settings page</li>
                <li><strong>Forwarding is enabled</strong> (the toggle/checkbox is turned on)</li>
                <li>Your LeadLocker address ({client?.inbound_email || "yourcompanyname@mg.leadlocker.app"}) is listed in the forwarding section</li>
              </ul>
              <p className="text-yellow-200 text-sm mt-2">
                Without the pink banner and forwarding enabled, LeadLocker won&apos;t receive your emails.
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-300">
              As soon as Gmail sends a forwarding confirmation email to LeadLocker, you'll see a button here
              to open the verification page.
            </p>
            <p className="text-yellow-400 text-sm mt-2">
              ⏳ Waiting for Gmail to send the verification email…
            </p>
          </>
        )}
      </div>
      <div className="flex justify-between">
        <button
          onClick={prev}
          className="text-gray-300 hover:text-white underline"
        >
          Back
        </button>
        <button
          onClick={next}
          disabled={!verificationLink}
          className={`flex items-center px-5 py-3 rounded-md font-semibold ${
            verificationLink
              ? "bg-white text-black hover:bg-gray-200"
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
          }`}
        >
          {verificationLink ? "Continue" : "Waiting for Gmail…"}
          <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
}

function Step3({
  client,
  next,
  prev,
}: {
  client: any;
  next: () => void;
  prev: () => void;
}) {
  return (
    <>
      <h2 className="text-2xl font-semibold mb-4">3. Send a Test Email</h2>
      <p className="text-gray-300 mb-6">
        After forwarding is confirmed, send a test email so we can detect your first real lead.
      </p>
      <div className="space-y-4 p-6 bg-gray-900/40 rounded-lg border border-gray-800 mb-6">
        <p className="text-gray-300">
          Send a test email to your regular business inbox. Gmail will forward it to your LeadLocker address
          automatically.
        </p>
        <div>
          <p className="text-gray-400 mb-1">Your business email:</p>
          <code className="bg-black/40 px-3 py-2 rounded text-blue-300 block">
            {client?.contact_email || "Loading..."}
          </code>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!client?.contact_email) return;
            
            // Create a realistic test quote for an electrician
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
            
            // Open Gmail compose in a new tab
            const subject = encodeURIComponent("Quote Request - Electrical Work");
            const body = encodeURIComponent(emailBody);
            const to = encodeURIComponent(client.contact_email);
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
            
            window.open(gmailUrl, "_blank", "noopener,noreferrer");
          }}
          className="inline-block mt-2 bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 cursor-pointer"
        >
          Send test email →
        </button>
        {!client?.forwarding_confirmed && (
          <p className="text-yellow-400 text-sm mt-4">
            ⏳ Waiting for your first forwarded email…
          </p>
        )}
        {client?.forwarding_confirmed && (
          <p className="text-green-400 text-sm mt-4">
            ✅ We have received at least one forwarded email and created a lead.
          </p>
        )}
      </div>
      <div className="flex justify-between">
        <button
          onClick={prev}
          className="text-gray-300 hover:text-white underline"
        >
          Back
        </button>
        <button
          onClick={next}
          disabled={!client?.forwarding_confirmed}
          className={`flex items-center px-5 py-3 rounded-md font-semibold ${
            client?.forwarding_confirmed
              ? "bg-white text-black hover:bg-gray-200"
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
          }`}
        >
          {client?.forwarding_confirmed ? "Continue" : "Waiting for first lead…"}
          <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </>
  );
}

function Step4({ client, prev }: { client: any; prev: () => void }) {
  return (
    <>
      <h2 className="text-2xl font-semibold mb-4">4. You're Almost Done</h2>
      <p className="text-gray-300 mb-6">
        Once your test email arrives in LeadLocker, you're fully set up. Click
        below to finish onboarding. You can always adjust forwarding later in
        your Gmail settings.
      </p>
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
        className="bg-white text-black px-5 py-3 rounded-md font-semibold hover:bg-gray-200 mb-8"
      >
        Finish Setup
      </button>
      <button
        onClick={prev}
        className="text-gray-300 hover:text-white underline"
      >
        Back
      </button>
    </>
  );
}

/* -------------------------------------------------------
   STEP COMPONENTS (Bubble + Lines)
------------------------------------------------------- */

function StepBubble({
  number,
  active,
  completed,
}: {
  number: number;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div
      className={`
        w-10 h-10 flex items-center justify-center rounded-full border-2
        ${
          completed
            ? "bg-white text-black border-white"
            : active
            ? "border-white text-white"
            : "border-gray-600 text-gray-600"
        }
      `}
    >
      {completed ? <Check className="w-5 h-5" /> : number}
    </div>
  );
}

function StepLine({ completed }: { completed: boolean }) {
  return (
    <div
      className={`
        w-16 h-1 rounded-full
        ${completed ? "bg-white" : "bg-gray-600"}
      `}
    />
  );
}
