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

      if (!res.ok || !data.ok) {
        setApiError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      console.log("[Login] Success, redirecting to:", from);

      if (data.token) {
        localStorage.setItem("ll_token", data.token as string);
      }

      // Wait longer for cookies to be fully set and propagated
      // This ensures middleware sees the cookies on the next request
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use window.location for a full page reload to ensure cookies are read
      // This forces a complete page reload so cookies are definitely sent
      console.log("[Login] Redirecting to:", from);
      window.location.href = from;
    } catch (err) {
      console.error(err);
      setApiError("Unexpected error — try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 shadow-md p-6 rounded-md text-white">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">LeadLocker</h1>
          <h2 className="text-xl font-semibold text-neutral-200">Login</h2>
        </div>

        {/* ACCOUNT CREATED SUCCESS */}
        {accountCreated && (
          <div className="mb-4 p-3 bg-green-900/30 text-green-300 border border-green-800 rounded-lg text-sm">
            Your account has been created. You can now log in.
          </div>
        )}

        {/* API ERROR */}
        {apiError && (
          <div className="mb-4 p-3 bg-red-900/30 text-red-300 border border-red-800 rounded-lg text-sm">
            {apiError}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300">
              Email
            </label>
            <input
              type="email"
              className="mt-1 w-full bg-neutral-800 border border-neutral-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition placeholder:text-neutral-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300">
              Password
            </label>
            <input
              type="password"
              className="mt-1 w-full bg-neutral-800 border border-neutral-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition placeholder:text-neutral-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-white text-black py-2 rounded-md hover:bg-neutral-100 disabled:opacity-60 font-semibold transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-sm text-center text-neutral-400 mt-4">
          Don't have an account?{" "}
          <a href="/signup" className="text-white font-medium underline hover:text-neutral-200">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}


