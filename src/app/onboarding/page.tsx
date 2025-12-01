"use client";

import { useState, useEffect } from "react";
import { Check, ChevronRight, Mail } from "lucide-react";
import Link from "next/link";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [inboundEmail, setInboundEmail] = useState("");

  // Fetch client data to get inbound_email and store in localStorage
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (data.client?.inbound_email) {
          setInboundEmail(data.client.inbound_email);
          localStorage.setItem("ll_inbound_email", data.client.inbound_email);
        }
      } catch (err) {
        console.error("Failed to load client:", err);
      }
    }
    load();
  }, []);

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center px-6 py-16">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold">Let's Get You Set Up</h1>
        <p className="text-gray-400 mt-2">
          Follow these quick steps to start collecting leads instantly.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center space-x-6 mb-12">
        <StepBubble number={1} active={step === 1} completed={step > 1} />
        <StepLine completed={step > 1} />
        <StepBubble number={2} active={step === 2} completed={step > 2} />
        <StepLine completed={step > 2} />
        <StepBubble number={3} active={step === 3} completed={false} />
      </div>

      {/* Panels */}
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-xl p-8 shadow-2xl">
        {step === 1 && <Step1 next={next} />}
        {step === 2 && <Step2 next={next} prev={prev} />}
        {step === 3 && <Step3 prev={prev} />}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   STEP UI COMPONENTS
------------------------------------------------------- */

function Step1({ next }: { next: () => void }) {
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
  next,
  prev,
}: {
  next: () => void;
  prev: () => void;
}) {
  return (
    <>
      <h2 className="text-2xl font-semibold mb-4">2. Send a Test Email</h2>
      <p className="text-gray-300 mb-6">
        After forwarding is set up, send a quick test to confirm everything is
        connected.
      </p>
      <button
        className="bg-white text-black px-5 py-3 rounded-md font-semibold hover:bg-gray-200 mb-6"
        onClick={async () => {
          try {
            const res = await fetch("/api/client/send-test-email", {
              method: "POST",
              credentials: "include",
            });
            if (res.ok) {
              alert("Test email sent! Check your forwarding to ensure it arrives.");
            } else {
              alert("Failed to send test email. Please try again.");
            }
          } catch (err) {
            console.error(err);
            alert("Error sending test email. Please try again.");
          }
        }}
      >
        Send Test Email
      </button>
      <div className="flex justify-between">
        <button
          onClick={prev}
          className="text-gray-300 hover:text-white underline"
        >
          Back
        </button>
        <button
          onClick={next}
          className="flex items-center bg-white text-black px-5 py-3 rounded-md font-semibold hover:bg-gray-200"
        >
          Continue
          <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </>
  );
}

function Step3({ prev }: { prev: () => void }) {
  return (
    <>
      <h2 className="text-2xl font-semibold mb-4">3. You're Almost Done</h2>
      <p className="text-gray-300 mb-6">
        Once your test email arrives in LeadLocker, you're fully set up. Click
        below to finish onboarding.
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
