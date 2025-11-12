"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirectedFrom, setRedirectedFrom] = useState<string | null>(null);
  const router = useRouter();

  const debugLog = useCallback((...args: unknown[]) => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  }, []);

  const navigateTo = useCallback(
    (path: string) => {
      if (typeof window === "undefined") return;
      router.replace(path);
      setTimeout(() => {
        if (window.location.pathname !== new URL(path, window.location.origin).pathname) {
          window.location.assign(path);
        }
      }, 150);
    },
    [router]
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setRedirectedFrom(params.get('redirectedFrom'));
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data?.user) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      // Wait a moment for session to be established
      await new Promise(resolve => setTimeout(resolve, 100));

      // Fetch linked client_id via API (uses service role, bypasses RLS)
      debugLog('[Login] Fetching user client_id via API');
      debugLog('[Login] User ID:', data.user.id);
      debugLog('[Login] User email:', data.user.email);
      
      // Get the access token from the auth response
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        setError("Failed to get access token");
        setLoading(false);
        return;
      }

      const userResponse = await fetch('/api/auth/get-user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[Login] API error:', errorData);
        setError(errorData.error || "Failed to get user information");
        setLoading(false);
        return;
      }

      const userData = await userResponse.json();
      debugLog('[Login] Found user with client_id:', userData.client_id);

      if (!userData.client_id) {
        setError("No client assigned to this user");
        setLoading(false);
        return;
      }

      // Check if redirectedFrom param exists and is valid
      let target = `/client/${userData.client_id}`;

      // Only accept safe paths that start with /client/
      if (redirectedFrom && redirectedFrom.startsWith("/client/")) {
        target = redirectedFrom;
      }

      debugLog('[Login] Redirecting to:', target);
      navigateTo(target);
    } catch (err: any) {
      console.error('[Login] Error:', err);
      setError(err?.message || "An error occurred during login");
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="flex flex-col gap-4 p-8 bg-neutral-900 rounded-xl w-80"
      >
        <h1 className="text-xl font-semibold text-white text-center">Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-2 rounded bg-neutral-800 text-white"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 rounded bg-neutral-800 text-white"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="p-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

