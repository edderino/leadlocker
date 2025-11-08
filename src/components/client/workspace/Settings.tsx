"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { themeOptions, useTheme } from "./ThemeContext";
import { supabase } from "@/libs/supabaseClient";

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

  async function handleUpdate() {
    try {
      setLoading(true);
      setMessage("");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setMessage("Unable to verify session. Please log in again.");
        return;
      }

      const user = session.user;

      const response = await fetch("/api/user/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: user?.id,
          name,
          phone,
        }),
      });

      const json = await response.json();
      setMessage(json.success ? "Profile updated successfully." : json.error);
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

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Password changed. Please log in again.");
      await supabase.auth.signOut();
      window.location.href = "/login";
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
        <div className="space-y-3 text-sm">
          <input
            className="w-full p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-600"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-600"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button
            variant="secondary"
            className="mt-2 text-xs"
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? "Saving..." : "Change Details"}
          </Button>
        </div>
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
              await supabase.auth.signOut();
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
        <p className="text-xs text-neutral-400">
          {message}
        </p>
      )}
    </div>
  );
}

