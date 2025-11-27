"use client";

import { useRouter } from "next/navigation";

export default function Navbar({ user }: { user: any }) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore network errors, still send user to login
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("ll_token");
    }
    router.push("/login");
  }

  return (
    <nav className="w-full border-b bg-white h-14 flex items-center px-4 justify-between">
      <div className="text-lg font-semibold">LeadLocker</div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 hidden sm:block">
          {user?.business_name || user?.email}
        </span>
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-1 border rounded-md hover:bg-gray-50"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}


