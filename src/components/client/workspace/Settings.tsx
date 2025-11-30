"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { themeOptions, useTheme } from "./ThemeContext";

export default function Settings() {
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailSummaries, setEmailSummaries] = useState(false);
  const [layout, setLayout] = useState("cards");
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [loadingClient, setLoadingClient] = useState(true);

  // Load current client data
  useEffect(() => {
    async function loadClient() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (data.client) {
          setName(data.client.owner_name || data.client.business_name || "");
          setPhone(data.client.sms_number || "");
        }
      } catch (err) {
        console.error("Failed to load client data:", err);
      } finally {
        setLoadingClient(false);
      }
    }
    loadClient();
  }, []);

  async function handleUpdate() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          owner_name: name,
          sms_number: phone,
        }),
      });

      const json = await response.json();
      if (response.ok) {
        setMessage("Profile updated successfully.");
        console.log("[Settings] Profile updated, dispatching clientUpdated event");
        
        // Trigger a refresh of client data in sidebar by dispatching a custom event
        window.dispatchEvent(new CustomEvent('clientUpdated', { detail: { name, phone } }));
        
        // Also reload client data in this component
        const refreshRes = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        const refreshData = await refreshRes.json();
        if (refreshData.client) {
          setName(refreshData.client.owner_name || refreshData.client.business_name || "");
          setPhone(refreshData.client.sms_number || "");
          console.log("[Settings] Refreshed client data:", refreshData.client);
        }
      } else {
        setMessage(json.error || "Failed to update profile.");
      }
    } catch (error: any) {
      setMessage(error?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword() {
    try {
      setLoading(true);
      setMessage("");

      // Call API to change password
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      const json = await response.json();
      
      if (!response.ok) {
        setMessage(json.error || "Failed to change password.");
        return;
      }

      setMessage("Password changed. Please log in again.");
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (error: any) {
      setMessage(error?.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6 text-neutral-100">
      <h2 className="text-xl font-semibold">Settings</h2>

      {/* Profile */}
      <Card className="p-6 bg-black border border-neutral-800 shadow-[0_0_15px_rgba(255,255,255,0.08)]">
        <h3 className="text-sm font-semibold uppercase text-neutral-300 mb-4 tracking-wide">
          Profile
        </h3>
        {loadingClient ? (
          <p className="text-neutral-400 text-sm">Loading...</p>
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Name</label>
              <input
                className="w-full p-2 rounded bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition placeholder:text-neutral-500"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Phone</label>
              <input
                className="w-full p-2 rounded bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition placeholder:text-neutral-500"
                placeholder="+61412345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <Button
              variant="secondary"
              className="mt-2 text-xs"
              onClick={handleUpdate}
              disabled={loading}
            >
              {loading ? "Saving..." : "Update Profile"}
            </Button>
          </div>
        )}
      </Card>

      {/* Notifications */}
      <Card className="p-6 bg-black border border-neutral-800 shadow-[0_0_15px_rgba(255,255,255,0.08)]">
        <h3 className="text-sm font-semibold uppercase text-neutral-300 mb-4 tracking-wide">
          Notifications
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">SMS Alerts</span>
            <Switch checked={smsAlerts} onCheckedChange={setSmsAlerts} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Email Summaries</span>
            <Switch checked={emailSummaries} onCheckedChange={setEmailSummaries} />
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card className="p-6 bg-black border border-neutral-800 shadow-[0_0_15px_rgba(255,255,255,0.08)]">
        <h3 className="text-sm font-semibold uppercase text-neutral-300 mb-4 tracking-wide">
          Appearance
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Default Lead Layout</span>
            <div className="flex gap-2">
              <Button
                variant={layout === "cards" ? "default" : "secondary"}
                size="sm"
                onClick={() => setLayout("cards")}
              >
                Cards
              </Button>
              <Button
                variant={layout === "table" ? "default" : "secondary"}
                size="sm"
                onClick={() => setLayout("table")}
              >
                Table
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Theme */}
      <Card className="p-6 bg-black border border-neutral-800 shadow-[0_0_15px_rgba(255,255,255,0.08)]">
        <h3 className="text-sm font-semibold uppercase text-neutral-300 mb-4 tracking-wide">
          Theme
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {themeOptions.map((option) => (
            <Button
              key={option.id}
              variant={theme === option.id ? "default" : "secondary"}
              size="sm"
              onClick={() => setTheme(option.id)}
              className="flex items-center gap-2"
            >
              <span className={`h-2 w-2 rounded-full ${option.swatch}`} />
              {option.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Account */}
      <Card className="p-6 bg-black border border-neutral-800 shadow-[0_0_15px_rgba(255,255,255,0.08)]">
        <h3 className="text-sm font-semibold uppercase text-neutral-300 mb-4 tracking-wide">
          Account
        </h3>
        <div className="space-y-3 text-sm">
          <input
            className="w-full p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-600"
            placeholder="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            variant="secondary"
            className="text-xs"
            onClick={handleChangePassword}
            disabled={loading}
          >
            {loading ? "Updating..." : "Change Password"}
          </Button>
          <Button 
            variant="destructive" 
            className="text-xs"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
              window.location.href = '/login';
            }}
          >
            Logout
          </Button>
        </div>
      </Card>

      {/* Support */}
      <Card className="p-6 bg-black border border-neutral-800 shadow-[0_0_15px_rgba(255,255,255,0.08)]">
        <h3 className="text-sm font-semibold uppercase text-neutral-300 mb-4 tracking-wide">
          Support
        </h3>
        <p className="text-neutral-400 text-sm">
          Need help? Contact{" "}
          <a
            href="mailto:support@leadlocker.app"
            className="text-white underline underline-offset-2"
          >
            support@leadlocker.app
          </a>
        </p>
      </Card>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.includes("successfully") || message.includes("success")
            ? "bg-green-900/30 text-green-300 border border-green-800"
            : "bg-red-900/30 text-red-300 border border-red-800"
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}

