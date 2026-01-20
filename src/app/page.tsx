"use client";

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
          <div className="text-xl font-semibold">LeadLocker</div>
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
          <h1 className="mb-6 text-5xl md:text-6xl font-bold leading-tight">
            LeadLocker
          </h1>
          <a
            href="#waitlist"
            className="inline-block px-8 py-3 bg-[#5b3fff] text-white font-semibold rounded-full hover:bg-[#4a2fcc] transition-colors"
          >
            Join the waitlist
          </a>
        </div>
      </section>

      {/* Problem Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto bg-slate-900/50 border border-[#2a2a2a] rounded-2xl p-8 md:p-12">
          <h2 className="mb-6 text-3xl md:text-4xl font-bold">
            All your leads in one place.
          </h2>
          <ul className="mb-6 space-y-3 text-lg text-gray-300">
            <li>• Enquiries come through Facebook, Instagram and Email</li>
            <li>• Messages get buried or forgotten</li>
            <li>• Late replies mean the job goes to someone else</li>
          </ul>
          <p className="text-lg text-gray-300">
            LeadLocker captures every lead and keeps it organised so nothing gets missed.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="mb-4 text-3xl md:text-4xl font-bold">How it works</h2>
          <p className="text-xl text-gray-300">Simple setup. No CRM learning curve.</p>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6 md:gap-8">
          <div className="bg-slate-900/50 border border-[#2a2a2a] rounded-xl p-6 md:p-8">
            <h3 className="mb-3 text-xl font-semibold">Step 1 — Connect your sources</h3>
            <p className="text-gray-300">
              Connect Facebook Lead Ads, Instagram and Email in minutes.
            </p>
          </div>
          <div className="bg-slate-900/50 border border-[#2a2a2a] rounded-xl p-6 md:p-8">
            <h3 className="mb-3 text-xl font-semibold">Step 2 — Leads arrive in one place</h3>
            <p className="text-gray-300">
              Each lead shows the name, phone number, source and time it came in, clearly organised in one dashboard.
            </p>
          </div>
          <div className="bg-slate-900/50 border border-[#2a2a2a] rounded-xl p-6 md:p-8">
            <h3 className="mb-3 text-xl font-semibold">Step 3 — Get notified</h3>
            <p className="text-gray-300">
              Instant SMS alerts so you can call back fast, even while you're on site.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="mb-4 text-3xl md:text-4xl font-bold">Why LeadLocker</h2>
          <p className="text-xl text-gray-300">Built for Australian trades and local service businesses.</p>
        </div>
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-slate-900/50 border border-[#2a2a2a] rounded-xl p-6 md:p-8">
            <h3 className="text-xl font-semibold mb-2">Reply while the lead is still fresh</h3>
          </div>
          <div className="bg-slate-900/50 border border-[#2a2a2a] rounded-xl p-6 md:p-8">
            <h3 className="text-xl font-semibold mb-2">No missed DMs, emails or lead forms</h3>
          </div>
          <div className="bg-slate-900/50 border border-[#2a2a2a] rounded-xl p-6 md:p-8">
            <h3 className="text-xl font-semibold mb-2">Clear dashboard, no clutter</h3>
          </div>
          <div className="bg-slate-900/50 border border-[#2a2a2a] rounded-xl p-6 md:p-8">
            <h3 className="text-xl font-semibold mb-2">Works on mobile</h3>
          </div>
        </div>
      </section>

      {/* Trust/Positioning Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto bg-slate-900/50 border-2 border-dashed border-[#2a2a2a] rounded-2xl p-8 md:p-12">
          <h2 className="mb-6 text-3xl md:text-4xl font-bold">Simple, practical lead management</h2>
          <p className="mb-4 text-lg text-gray-300">
            Leads come in. They're organised clearly. You get notified so you can follow up fast.
          </p>
          <p className="text-lg text-gray-300">
            Everything lives in one place, so jobs never go missing even on busy days.
          </p>
        </div>
      </section>

      {/* Waitlist Section */}
      <section id="waitlist" className="container mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto bg-slate-900/50 border border-[#2a2a2a] rounded-2xl p-8 md:p-12">
          <h2 className="mb-4 text-3xl md:text-4xl font-bold text-center">Join the LeadLocker waitlist</h2>
          <p className="mb-8 text-center text-lg text-gray-300">
            Early access for Australian tradies and local businesses.
          </p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
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

      {/* FAQ Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto bg-slate-900/50 border border-[#2a2a2a] rounded-2xl p-8 md:p-12">
          <h2 className="mb-8 text-3xl md:text-4xl font-bold">Frequently asked</h2>
          <div className="space-y-8">
            <div>
              <h3 className="mb-2 text-xl font-semibold">Is LeadLocker free right now?</h3>
              <p className="text-gray-300">
                Yes. LeadLocker is currently free during early access.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-semibold">What can I connect?</h3>
              <p className="text-gray-300">
                Facebook Lead Ads, Instagram and Email at launch.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-semibold">What happens when a lead comes in?</h3>
              <p className="text-gray-300">
                It appears in your dashboard with the contact details and source, and you get an SMS so you can follow up straight away.
              </p>
            </div>
          </div>
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
