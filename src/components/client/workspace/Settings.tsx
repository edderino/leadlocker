'use client';

export default function Settings({ orgId }: { orgId: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="text-[11px] uppercase tracking-widest text-gray-400">Settings</div>
      <div className="mt-3 text-sm text-gray-300">
        Minimal for Phase 2. We'll add user auth + profile later.
        <div className="mt-2 text-gray-500">Client ID: <span className="font-mono">{orgId}</span></div>
      </div>
    </div>
  );
}
