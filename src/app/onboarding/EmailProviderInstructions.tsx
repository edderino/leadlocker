"use client";

import { useState } from "react";

const PROVIDERS = [
  { key: "gmail", label: "Gmail" },
  { key: "outlook", label: "Outlook / Office365" },
  { key: "icloud", label: "iCloud" },
  {
    key: "custom",
    label: "Custom Domain (GoDaddy / Namecheap / cPanel)",
  },
];

export default function EmailProviderInstructions({
  forwardingEmail,
}: {
  forwardingEmail: string;
}) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-4">Choose your email provider</h2>
      <div className="space-y-4">
        {PROVIDERS.map((p) => (
          <div
            key={p.key}
            className="border border-neutral-800 rounded-lg bg-neutral-900"
          >
            <button
              onClick={() => setOpen(open === p.key ? null : p.key)}
              className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-neutral-800"
            >
              <span className="text-lg">{p.label}</span>
              <span className="text-neutral-500">
                {open === p.key ? "−" : "+"}
              </span>
            </button>

            {open === p.key && (
              <div className="p-4 space-y-4 text-neutral-300 border-t border-neutral-800">
                {/* GMAIL SECTION */}
                {p.key === "gmail" && (
                  <>
                    <p className="text-neutral-200 font-semibold">
                      How to set up Gmail forwarding:
                    </p>
                    <ol className="list-decimal list-inside space-y-3 leading-relaxed">
                      <li>
                        Open Gmail settings →{" "}
                        <strong>See all settings</strong>
                      </li>
                      <li>
                        Go to <strong>Forwarding and POP/IMAP</strong>
                      </li>
                      <li>
                        Click <strong>Add a forwarding address</strong>
                      </li>
                      <li>
                        Enter:
                        <div className="mt-2 font-mono text-sm bg-neutral-800 px-3 py-2 rounded break-all">
                          {forwardingEmail}
                        </div>
                      </li>
                      <li>
                        Gmail will send a verification code.
                        <br />
                        <span className="text-green-400">
                          LeadLocker handles this automatically — no action
                          needed.
                        </span>
                      </li>
                      <li>
                        Select{" "}
                        <strong>&quot;Forward a copy of incoming mail&quot;</strong>
                      </li>
                      <li>
                        Press <strong>Save Changes</strong>
                      </li>
                    </ol>
                    <div className="mt-4 bg-neutral-800 p-3 rounded text-sm">
                      📌{" "}
                      <strong>
                        Once Gmail sends ANY test email, we will automatically
                        verify forwarding.
                      </strong>
                    </div>
                    {/* Placeholder for screenshots */}
                    <div className="mt-6">
                      <div className="text-neutral-500 text-sm">
                        Screenshots coming soon
                      </div>
                      <div className="h-32 bg-neutral-800 rounded mt-2 opacity-40" />
                      <div className="h-32 bg-neutral-800 rounded mt-2 opacity-40" />
                      <div className="h-32 bg-neutral-800 rounded mt-2 opacity-40" />
                    </div>
                  </>
                )}

                {/* OUTLOOK SECTION */}
                {p.key === "outlook" && (
                  <div className="text-neutral-400">
                    Outlook/Office365 instructions coming soon.
                  </div>
                )}

                {/* ICLOUD SECTION */}
                {p.key === "icloud" && (
                  <div className="text-neutral-400">
                    iCloud forwarding instructions coming soon.
                  </div>
                )}

                {/* CUSTOM DOMAIN */}
                {p.key === "custom" && (
                  <div className="text-neutral-400">
                    Custom domain forwarding varies by provider.
                    <br />
                    Go to your domain admin panel → Email → Forwarding → Add:
                    <div className="font-mono text-sm bg-neutral-800 px-3 py-2 rounded mt-2 break-all">
                      {forwardingEmail}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


