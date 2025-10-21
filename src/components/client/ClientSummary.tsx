interface Lead {
  status: 'NEW' | 'APPROVED' | 'COMPLETED';
}

interface ClientSummaryProps {
  leads: Lead[];
}

export default function ClientSummary({ leads }: ClientSummaryProps) {
  const total = leads.length;
  const newCount = leads.filter(l => l.status === 'NEW').length;
  const approvedCount = leads.filter(l => l.status === 'APPROVED').length;
  const completedCount = leads.filter(l => l.status === 'COMPLETED').length;

  const statCards = [
    {
      label: 'Total Leads',
      value: total,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      label: 'Needs Attention',
      value: newCount,
      color: 'bg-red-50 text-red-700 border-red-200',
    },
    {
      label: 'Approved',
      value: approvedCount,
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    },
    {
      label: 'Completed',
      value: completedCount,
      color: 'bg-green-50 text-green-700 border-green-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-lg border-2 p-4 ${stat.color}`}
        >
          <div className="text-3xl font-bold mb-1">{stat.value}</div>
          <div className="text-sm font-medium">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

