"use client";

import Image from "next/image";
import { useState, FormEvent } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    if (!validateEmail(email)) {
      setMessage({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setMessage({ type: "success", text: "You're on the list. We'll be in touch soon." });
      setEmail("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-[#2a2a2a]">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/logo/L (7).png"
              alt="LeadLocker"
              width={96}
              height={96}
              className="h-24 w-24"
              priority
            />
            <span className="sr-only">LeadLocker</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Login
            </a>
            <a
              href="/signup"
              className="px-4 py-2 text-sm font-semibold bg-[#5b3fff] text-white rounded-full hover:bg-[#4a2fcc] transition-colors"
            >
              Create account
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block mb-4 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#5b3fff] bg-[#1f1b3d] rounded-full">
            EARLY ACCESS
          </span>
          <h1 className="mb-4 text-4xl md:text-5xl font-bold leading-tight">
            LeadLocker
          </h1>
          <p className="mb-6 text-lg md:text-xl text-gray-300">
            All your leads in one place.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="#waitlist"
              className="inline-block px-8 py-3 bg-[#5b3fff] text-white font-semibold rounded-full hover:bg-[#4a2fcc] transition-colors"
            >
              Join the waitlist
            </a>
            <a
              href="#how-it-works"
              className="inline-block px-6 py-3 text-sm font-medium text-gray-200 border border-[#2a2a2a] rounded-full hover:bg-white/5 transition-colors"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Simple, practical lead management (moved up) */}
      <section className="container mx-auto px-6 py-16 text-center">
        <div className="max-w-3xl mx-auto bg-slate-900/50 border border-[#2a2a2a] rounded-2xl p-8 md:p-12">
          <h2 className="mb-6 text-3xl md:text-4xl font-bold">
            Lead Management made Simple.
          </h2>
          <p className="mb-4 text-lg text-gray-300">
            Instead of checking multiple apps and inboxes, everything is kept in one clear
            dashboard.
          </p>
          <p className="text-lg text-gray-300">
            Leads come in. They're organised. You're notified.
            <br />
            Nothing slips through the cracks, even on busy days.
          </p>
        </div>
      </section>

      {/* Without LeadLocker */}
      <section className="container mx-auto px-6 py-16 text-center">
        <div className="max-w-3xl mx-auto bg-slate-900/50 border border-[#2a2a2a] rounded-2xl p-8 md:p-12">
          <h2 className="mb-4 text-2xl md:text-3xl font-bold">
            Without LeadLocker
          </h2>
          <ul className="mb-6 space-y-3 text-lg text-gray-300">
            <li>• Enquiries spread across apps</li>
            <li>• Slow replies</li>
            <li>• Missed follow-ups</li>
            <li>• Lost jobs</li>
          </ul>
          <p className="text-lg text-gray-300">
            This is how good work gets lost.
          </p>
        </div>
      </section>

      {/* With LeadLocker */}
      <section className="container mx-auto px-6 py-16 text-center">
        <div className="max-w-3xl mx-auto bg-slate-900/50 border border-[#2a2a2a] rounded-2xl p-8 md:p-12">
          <h2 className="mb-4 text-2xl md:text-3xl font-bold">With LeadLocker</h2>
          <p className="mb-6 text-lg text-gray-300">
            Automatically captures every lead and keeps it organised in one place.
          </p>
          <p className="mb-4 text-lg text-gray-300 font-semibold">
            You always know:
          </p>
          <ul className="mb-6 space-y-2 text-lg text-gray-300">
            <li>• Who contacted you</li>
            <li>• How to reach them</li>
            <li>• Where the lead came from</li>
            <li>• When it came in</li>
          </ul>
          <p className="text-lg text-gray-300">
            And you're notified instantly so you can call back fast.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="mb-4 text-3xl md:text-4xl font-bold">How it works</h2>
          <p className="text-xl text-gray-300">
            Simple setup. No complex software to learn.
          </p>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6 md:gap-8">
          <div className="bg-slate-900/50 border border-[#2a2a2a] rounded-xl p-6 md:p-8">
            <h3 className="mb-3 text-xl font-semibold">Step 1 — Connect your sources</h3>
            <p className="text-gray-300">
              Connect Facebook Lead Ads, Instagram and email in minutes.
            </p>
          </div>
          <div className="bg-slate-900/50 border border-[#2a2a2a] rounded-xl p-6 md:p-8">
            <h3 className="mb-3 text-xl font-semibold">Step 2 — Leads are clearly organised</h3>
            <p className="text-gray-300">
              Each lead appears in one dashboard showing the name, phone number, time and
              source.
            </p>
          </div>
          <div className="bg-slate-900/50 border border-[#2a2a2a] rounded-xl p-6 md:p-8">
            <h3 className="mb-3 text-xl font-semibold">Step 3 — Get notified</h3>
            <p className="text-gray-300">
              You receive an instant SMS alert so you can follow up while the job is still hot.
            </p>
          </div>
        </div>
      </section>

      {/* No lock-in / friction section */}
      <section className="container mx-auto px-6 py-16 text-center">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="mb-4 text-3xl md:text-4xl font-bold">
            No lock-in. No friction.
          </h2>
        </div>
        <div className="max-w-xl mx-auto space-y-3 text-lg text-gray-300">
          <p>✓ Fast setup</p>
          <p>✓ Cancel anytime</p>
          <p>✓ No contracts</p>
          <p>✓ Australian built and supported</p>
        </div>
      </section>

      {/* Waitlist Section */}
      <section id="waitlist" className="container mx-auto px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto bg-slate-900/50 border border-[#2a2a2a] rounded-2xl p-8 md:p-12">
          <h2 className="mb-8 text-3xl md:text-4xl font-bold text-center">
            Join the LeadLocker waitlist.
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-black border border-[#2a2a2a] text-white rounded-full focus:outline-none focus:ring-2 focus:ring-[#5b3fff] focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-[#5b3fff] text-white font-semibold rounded-full hover:bg-[#4a2fcc] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Joining..." : "Join the waitlist"}
            </button>
            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-900/30 text-green-300 border border-green-800"
                    : "bg-red-900/30 text-red-300 border border-red-800"
                }`}
              >
                {message.text}
              </div>
            )}
            <p className="text-sm text-center text-gray-400">
              No spam. No sales calls. Just a message when access opens.
            </p>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2a2a2a] py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400 font-medium">LeadLocker</p>
        </div>
      </footer>
    </main>
  );
}
