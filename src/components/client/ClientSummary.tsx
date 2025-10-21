import { AlertCircle, CheckCircle, ClipboardList } from 'lucide-react';

interface Lead {
  status: 'NEW' | 'APPROVED' | 'COMPLETED';
}

interface ClientSummaryProps {
  leads: Lead[];
}

export default function ClientSummary({ leads }: ClientSummaryProps) {
  const newCount = leads.filter(l => l.status === 'NEW').length;
  const approvedCount = leads.filter(l => l.status === 'APPROVED').length;
  const completedCount = leads.filter(l => l.status === 'COMPLETED').length;

  const statCards = [
    {
      label: 'Needs Attention',
      value: newCount,
      icon: AlertCircle,
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      iconColor: 'text-red-500',
      borderColor: 'border-red-200',
    },
    {
      label: 'Approved',
      value: approvedCount,
      icon: ClipboardList,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      iconColor: 'text-yellow-500',
      borderColor: 'border-yellow-200',
    },
    {
      label: 'Completed',
      value: completedCount,
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      iconColor: 'text-green-500',
      borderColor: 'border-green-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`${stat.bgColor} ${stat.borderColor} rounded-lg border p-6 flex flex-col items-center justify-center transition-shadow hover:shadow-md`}
          >
            <Icon className={`h-8 w-8 ${stat.iconColor} mb-2`} />
            <div className={`text-4xl font-bold ${stat.textColor} mb-1`}>
              {stat.value}
            </div>
            <div className="text-sm font-medium text-gray-600">
              {stat.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

