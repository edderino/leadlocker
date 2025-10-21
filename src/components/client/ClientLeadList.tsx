import { relativeTime } from '@/libs/time';

interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  description: string | null;
  status: 'NEW' | 'APPROVED' | 'COMPLETED';
  created_at: string;
}

interface ClientLeadListProps {
  leads: Lead[];
}

const getStatusBadge = (status: Lead['status']) => {
  const styles = {
    NEW: 'bg-red-100 text-red-800',
    APPROVED: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800',
  };

  const labels = {
    NEW: 'Needs Attention',
    APPROVED: 'Approved',
    COMPLETED: 'Completed',
  };

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export default function ClientLeadList({ leads }: ClientLeadListProps) {
  if (leads.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500">No leads yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                  {lead.description && (
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {lead.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <a
                    href={`tel:${lead.phone}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {lead.phone}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{lead.source}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(lead.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {relativeTime(lead.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked List View */}
      <div className="md:hidden divide-y divide-gray-200">
        {leads.map((lead) => (
          <div key={lead.id} className="p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <div className="font-medium text-gray-900">{lead.name}</div>
              {getStatusBadge(lead.status)}
            </div>
            <div className="space-y-1 text-sm">
              <div>
                <a
                  href={`tel:${lead.phone}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {lead.phone}
                </a>
              </div>
              <div className="text-gray-500">
                <span className="font-medium">Source:</span> {lead.source}
              </div>
              {lead.description && (
                <div className="text-gray-500">{lead.description}</div>
              )}
              <div className="text-gray-400 text-xs">
                {relativeTime(lead.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

