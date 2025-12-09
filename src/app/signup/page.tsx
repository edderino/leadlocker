"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);

  // Check for error in URL params
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "no_client") {
      setApiError(
        "Your account exists but is missing profile information. Please complete signup below."
      );
    }
  }, []);

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
        credentials: "include", // IMPORTANT: Include cookies in request/response
        body: JSON.stringify({
          owner_name: company,
          business_name: company,
          contact_email: email,
          sms_number: phone,
          password,
        }),
      });

      console.log("[SIGNUP PAGE] 📥 API Response:", {
        ok: res.ok,
        status: res.status,
        responseHeaders: Object.fromEntries(res.headers.entries()),
      });

      const data = await res.json();

      console.log("[SIGNUP PAGE] 📥 Parsed JSON response:", {
        dataOk: data.ok,
        hasError: !!data.error,
        error: data.error,
        redirect: data.redirect,
      });

      if (!res.ok || !data.ok) {
        console.error("[SIGNUP PAGE] ❌ Signup failed:", data.error);
        setApiError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      console.log("[SIGNUP PAGE] ✅ Signup successful");
      console.log("[SIGNUP PAGE] ⏳ Waiting for cookies to be set by browser...");
      
      // Wait a moment for browser to process Set-Cookie headers
      // httpOnly cookies can't be checked via JavaScript, so we just wait
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("[SIGNUP PAGE] 🔄 Redirecting to:", data.redirect || "/dashboard");
      // Use window.location.href for full page reload to ensure cookies are sent
      window.location.href = data.redirect || "/dashboard";
    } catch (err) {
      console.error(err);
      setApiError("Unexpected error — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-black">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 p-8 rounded-2xl shadow-lg text-white">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">LeadLocker</h1>
          <h2 className="text-xl font-semibold tracking-tight text-neutral-200">
            Create your account
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            Start capturing and tracking leads in under a minute.
          </p>
        </div>

        {/* API Error */}
        {apiError && (
          <div className="mb-4 p-3 bg-red-900/30 text-red-300 border border-red-800 rounded-lg text-sm">
            {apiError}
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-300">
              Work email
            </label>
            <input
              type="email"
              placeholder="you@company.com"
              className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition placeholder:text-neutral-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-300">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition placeholder:text-neutral-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-300">
              Company name
            </label>
            <input
              type="text"
              placeholder="Your business name"
              className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition placeholder:text-neutral-500"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            {errors.company && (
              <p className="text-red-400 text-sm mt-1">{errors.company}</p>
            )}
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-300">
              Mobile number
            </label>
            <input
              type="tel"
              className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition placeholder:text-neutral-500"
              placeholder="+61412345678"
              value={phone}
              onChange={(e) => {
                let value = e.target.value;
                
                // Remove all non-digit characters except +
                const cleaned = value.replace(/[^\d+]/g, '');
                
                // If starts with 04, convert to +614
                if (cleaned.startsWith('04')) {
                  value = '+61' + cleaned.substring(2);
                } 
                // If starts with 4 (without 0), convert to +614
                else if (cleaned.startsWith('4') && !cleaned.startsWith('+61')) {
                  value = '+614' + cleaned.substring(1);
                }
                // If starts with +61, keep it
                else if (cleaned.startsWith('+61')) {
                  value = cleaned;
                }
                // If starts with 61 (without +), add +
                else if (cleaned.startsWith('61') && !cleaned.startsWith('+61')) {
                  value = '+' + cleaned;
                }
                // Otherwise, keep the cleaned value
                else {
                  value = cleaned;
                }
                
                setPhone(value);
              }}
            />
            {errors.phone && (
              <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Submit */}
          <button
            disabled={loading}
            type="submit"
            className="w-full bg-white text-black py-2.5 rounded-lg font-semibold text-sm tracking-wide disabled:opacity-60 disabled:cursor-not-allowed hover:bg-neutral-100 transition"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-neutral-400">
          Already have an account?{" "}
          <a href="/login" className="text-white font-medium underline hover:text-neutral-200">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}



