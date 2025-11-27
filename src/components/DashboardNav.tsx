"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardNav({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore network issues; we'll still route away
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("ll_token");
    }
    router.push("/login");
  };

  const displayName =
    user?.business_name || user?.name || user?.email || "User";

  return (
    <header className="w-full bg-white border-b shadow-sm">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="text-xl font-semibold tracking-tight">
          LeadLocker
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-100 transition"
          >
            <span className="font-medium truncate max-w-[140px]">
              {displayName}
            </span>
            <span className="text-gray-500">▾</span>
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-44 bg-white border shadow-md rounded-md overflow-hidden z-20">
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                onClick={() => {
                  setOpen(false);
                  router.push("/dashboard/settings");
                }}
              >
                Account Settings
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                onClick={() => {
                  setOpen(false);
                  router.push("/dashboard/company");
                }}
              >
                Company
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
                onClick={logout}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


