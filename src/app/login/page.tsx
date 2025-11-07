"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [redirectedFrom, setRedirectedFrom] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setRedirectedFrom(params.get('redirectedFrom'));
    }
  }, []);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.user) {
      setError("Invalid email or password");
      return;
    }

    // fetch linked client_id
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("client_id")
      .eq("auth_id", data.user.id)
      .single();

    if (userError || !userRow?.client_id) {
      setError("No client assigned to this user");
      return;
    }

    // check if redirectedFrom param exists
    const target = redirectedFrom
      ? redirectedFrom
      : `/client/${userRow.client_id}`;

    router.push(target);
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
          className="p-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}

