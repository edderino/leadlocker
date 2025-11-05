'use client';

export default function Messages({ orgId }: { orgId: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-gray-300">
      <div className="text-[11px] uppercase tracking-widest text-gray-400 mb-2">Messages</div>
      <p>
        Threaded messaging UI will live here (Phase 3). For now, reply per-lead from the Leads section.
        <span className="text-gray-500 ml-2">org: {orgId}</span>
      </p>
    </div>
  );
}
