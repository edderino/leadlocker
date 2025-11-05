'use client';

import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-12 text-center">
      <div className="inline-flex p-4 rounded-full bg-white/10 mb-4">
        <SettingsIcon className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-white text-xl font-semibold mb-2">Settings</h3>
      <p className="text-gray-400 max-w-md mx-auto">
        Preferences, notifications, and account settings will be available here soon.
      </p>
    </div>
  );
}

