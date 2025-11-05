export default function StatusPill({ v }: { v: 'NEW' | 'APPROVED' | 'COMPLETED' }) {
  const map = {
    NEW: { bg: 'bg-acc-red/10', text: 'text-acc-red', label: 'Needs Attention' },
    APPROVED: { bg: 'bg-acc-amber/10', text: 'text-acc-amber', label: 'Approved' },
    COMPLETED: { bg: 'bg-acc-green/10', text: 'text-acc-green', label: 'Completed' },
  } as const;
  const m = map[v];
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${m.bg} ${m.text} border border-white/5`}>
      {m.label}
    </span>
  );
}

