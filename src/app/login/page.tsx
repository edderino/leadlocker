"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [from, setFrom] = useState("/dashboard");
  const [accountCreated, setAccountCreated] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Read search params on the client to avoid build-time CSR bailout issues
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get("from");
    if (fromParam) setFrom(fromParam);
    setAccountCreated(params.get("created") === "1");
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");

    try {
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem("ll_token", data.token as string);
      }

      // Successful → redirect to original protected route or dashboard
      router.push(from);
    } catch (err) {
      console.error(err);
      setApiError("Unexpected error — try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white shadow-md p-6 rounded-md">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Login</h1>

        {/* ACCOUNT CREATED SUCCESS */}
        {accountCreated && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-300 rounded-lg text-sm">
            Your account has been created. You can now log in.
          </div>
        )}

        {/* API ERROR */}
        {apiError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm">
            {apiError}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              className="mt-1 w-full border rounded-md px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              className="mt-1 w-full border rounded-md px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-900 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600 mt-4">
          Don’t have an account?{" "}
          <a href="/signup" className="text-black font-medium underline">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}


