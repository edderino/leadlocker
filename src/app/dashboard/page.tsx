"use client";

import Link from "next/link";

export default function DashboardPage() {
  // Auth + nav are handled by the dashboard layout; this is the main content.
  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 text-sm">
            Welcome to your LeadLocker dashboard.
          </p>
        </div>
      </header>

      {/* Welcome Box */}
      <div className="bg-white p-5 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-1">Welcome!</h2>
        <p className="text-gray-600">
          This is your LeadLocker dashboard. Use the tools below to get
          started.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <Link
          href="/dashboard/leads/new"
          className="bg-white p-4 rounded-lg shadow hover:shadow-md transition border"
        >
          <h3 className="text-lg font-semibold mb-1">Add Lead</h3>
          <p className="text-gray-600 text-sm">Create a new lead manually</p>
        </Link>

        <Link
          href="/dashboard/leads"
          className="bg-white p-4 rounded-lg shadow hover:shadow-md transition border"
        >
          <h3 className="text-lg font-semibold mb-1">View Leads</h3>
          <p className="text-gray-600 text-sm">Browse incoming leads</p>
        </Link>

        <Link
          href="/dashboard/settings"
          className="bg-white p-4 rounded-lg shadow hover:shadow-md transition border"
        >
          <h3 className="text-lg font-semibold mb-1">Settings</h3>
          <p className="text-gray-600 text-sm">
            Phone, email, forwarding and more
          </p>
        </Link>
      </div>

      {/* Empty State (placeholder for when leads are implemented) */}
      <div className="mt-10 bg-white p-6 rounded-lg shadow text-center border">
        <p className="text-gray-700 text-lg font-medium">
          You have no recent leads.
        </p>
        <p className="text-gray-500 text-sm mt-1">
          New leads will appear here automatically — no refresh needed.
        </p>
      </div>
    </div>
  );
}



