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
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border text-gray-900">
        <h1 className="text-2xl font-semibold text-center mb-6">
          Create your account
        </h1>

        {/* API Error */}
        {apiError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm">
            {apiError}
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded-lg px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block font-medium mb-1">Password</label>
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Company Name */}
          <div>
            <label className="block font-medium mb-1">Company Name</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            {errors.company && (
              <p className="text-red-600 text-sm mt-1">{errors.company}</p>
            )}
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block font-medium mb-1">Mobile Number</label>
            <input
              type="tel"
              className="w-full border rounded-lg px-3 py-2"
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
            className="w-full bg-black text-white py-2 rounded-lg font-semibold disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-black underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}



