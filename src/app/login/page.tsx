'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/libs/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // TEMP redirect — we'll replace this with their linked orgId later
    router.push('/client/demo');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0e1014] text-gray-200">
      <form
        onSubmit={handleLogin}
        className="bg-[#13161c] border border-[#1e2128] rounded-xl p-8 w-full max-w-sm shadow-lg"
      >
        <h1 className="text-xl font-semibold mb-6 text-center text-gray-100">LeadLocker Login</h1>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full bg-[#1a1d23] border border-[#2a2d35] rounded-md p-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full bg-[#1a1d23] border border-[#2a2d35] rounded-md p-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-md transition-all disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Login'}
        </button>
      </form>
    </div>
  );
}

