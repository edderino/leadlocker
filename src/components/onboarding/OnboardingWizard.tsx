"use client";

import { useState } from "react";
import EmailForwardingWizard from "./EmailForwardingWizard";
import ForwardingStatus from "./ForwardingStatus";

interface OnboardingWizardProps {
  client: any;
}

export default function OnboardingWizard({ client }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);

  const next = () => setStep((s) => Math.min(3, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="mt-10 w-full max-w-xl mx-auto">

      {/* STEP INDICATOR */}
      <div className="flex items-center justify-between mb-10">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`flex-1 h-1 mx-1 rounded ${
              n <= step ? "bg-green-500" : "bg-neutral-700"
            }`}
          />
        ))}
      </div>

      {/* STEP CONTENT */}
      {step === 1 && <Step1 client={client} />}
      {step === 2 && <Step2 client={client} />}
      {step === 3 && <Step3 client={client} />}

      {/* NAVIGATION BUTTONS */}
      <div className="flex justify-between mt-12">
        {step > 1 ? (
          <button
            className="text-gray-400 hover:text-white"
            onClick={back}
          >
            Back
          </button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <button
            className="bg-white text-black px-5 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
            onClick={next}
          >
            Continue
          </button>
        ) : (
          <button
            className="bg-green-500 text-black px-5 py-2 rounded-lg font-semibold hover:bg-green-400 transition"
            onClick={async () => {
              // Will be implemented in Step 9
              alert("We'll finish onboarding in Step 9");
            }}
          >
            Finish
          </button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------
   STEP 1: Confirm Your Details
--------------------------------*/
function Step1({ client }: { client: any }) {
  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4">Step 1: Confirm Your Details</h2>
      <p className="text-gray-300 mb-6">
        Before we configure email forwarding, confirm your account details.
      </p>

      <div className="space-y-4">
        <Field label="Business Name" value={client.business_name} />
        <Field label="Owner Name" value={client.owner_name} />
        <Field label="Contact Email" value={client.contact_email} />
        <Field label="Forwarding Address" value={client.inbound_email} mono />
      </div>

      <p className="text-sm text-gray-500 mt-6">
        These details help us route your leads correctly.
      </p>
    </div>
  );
}

/* -------------------------------
   STEP 2: Forwarding Instructions
--------------------------------*/
function Step2({ client }: { client: any }) {
  return (
    <div>
      <ForwardingStatus clientId={client.id} />
      <EmailForwardingWizard 
        inboundEmail={client.inbound_email} 
        contactEmail={client.contact_email}
      />
    </div>
  );
}

/* -------------------------------
   STEP 3: Final Confirmation
--------------------------------*/
function Step3({ client }: { client: any }) {
  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4">Step 3: You're Almost Done</h2>
      <p className="text-gray-300 mb-6">
        Once forwarding has been configured, click "Finish" and we'll
        activate your dashboard.
      </p>

      <ul className="text-gray-400 list-disc pl-6 space-y-2">
        <li>Forwarding email set correctly</li>
        <li>Test email sent and received</li>
        <li>LeadLocker has processed the first forward</li>
      </ul>

      <p className="text-gray-500 mt-6 text-sm">
        After finishing, you'll be redirected to your full dashboard.
      </p>
    </div>
  );
}

/* -------------------------------
   FIELD COMPONENT
--------------------------------*/
function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-gray-400 text-sm">{label}</p>
      <div
        className={`mt-1 px-3 py-2 rounded bg-neutral-800 ${
          mono ? "font-mono text-sm break-all" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

