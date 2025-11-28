"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Field-level errors
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    company: "",
    phone: "",
  });

  function validate() {
    const newErrs: {
      email: string;
      password: string;
      company: string;
      phone: string;
    } = {
      email: "",
      password: "",
      company: "",
      phone: "",
    };
    let ok = true;

    if (!email.includes("@")) {
      newErrs.email = "Enter a valid email address.";
      ok = false;
    }

    if (password.length < 6) {
      newErrs.password = "Password must be at least 6 characters.";
      ok = false;
    }

    if (company.trim().length < 2) {
      newErrs.company = "Enter your business or company name.";
      ok = false;
    }

    if (phone.trim().length < 6) {
      newErrs.phone = "Enter a valid mobile number.";
      ok = false;
    }

    setErrors(newErrs);
    return ok;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");

    if (!validate()) return;

    try {
      setLoading(true);

      // Keep using JSON API contract to match backend expectations
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_name: company,
          business_name: company,
          contact_email: email,
          sms_number: phone,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setApiError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      // Cookie is set server-side; just go to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setApiError("Unexpected error — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-slate-100 text-gray-900">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Start capturing and tracking leads in under a minute.
          </p>
        </div>

        {/* API Error */}
        {apiError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
            {apiError}
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Work email
            </label>
            <input
              type="email"
              placeholder="you@company.com"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Password
            </label>
            <input
              type="password"
              placeholder="At least 6 characters"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Company name
            </label>
            <input
              type="text"
              placeholder="Redinc Plumbing"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            {errors.company && (
              <p className="text-red-600 text-sm mt-1">{errors.company}</p>
            )}
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Mobile number
            </label>
            <input
              type="tel"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition"
              placeholder="+61412345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {errors.phone && (
              <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Submit */}
          <button
            disabled={loading}
            type="submit"
            className="w-full bg-black text-white py-2.5 rounded-lg font-semibold text-sm tracking-wide disabled:opacity-60 disabled:cursor-not-allowed hover:bg-zinc-900 transition"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-black font-medium underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}



