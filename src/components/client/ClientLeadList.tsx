import { relativeTime } from '@/libs/time';
import { Phone, MapPin } from 'lucide-react';

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

const statusColors = {
  NEW: 'bg-red-100 text-red-700 border-red-200',
  APPROVED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
};

const statusLabels = {
  NEW: 'Needs Attention',
  APPROVED: 'Approved',
  COMPLETED: 'Completed',
};

const getStatusBadge = (status: Lead['status']) => {
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusColors[status]}`}>
      {statusLabels[status]}
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
    <div className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lead
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map((lead, index) => (
              <tr 
                key={lead.id} 
                className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
              >
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{lead.name}</div>
                    {lead.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs mt-1">
                        {lead.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <a
                    href={`tel:${lead.phone}`}
                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {lead.phone}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5 text-sm text-gray-700">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    {lead.source}
                  </div>
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
        {leads.map((lead, index) => (
          <div 
            key={lead.id} 
            className={`p-4 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="font-semibold text-gray-900">{lead.name}</div>
              {getStatusBadge(lead.status)}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                <a
                  href={`tel:${lead.phone}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {lead.phone}
                </a>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                {lead.source}
              </div>
              {lead.description && (
                <div className="text-gray-500 mt-2 text-xs">
                  {lead.description}
                </div>
              )}
              <div className="text-gray-400 text-xs mt-2">
                {relativeTime(lead.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply box */}
      <div className="border-t border-gray-200 p-4 flex items-center gap-3 bg-gray-50">
        <input
          id="reply-message"
          type="text"
          placeholder="Type a reply to all new leads..."
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={async () => {
            const input = document.getElementById("reply-message") as HTMLInputElement;
            const body = input.value.trim();
            if (!body) return alert("Type a message first");
            const res = await fetch("/api/client/messages/send", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-client-token": process.env.NEXT_PUBLIC_CLIENT_PORTAL_SECRET || "",
              },
              body: JSON.stringify({
                orgId: document.cookie
                  .split("; ")
                  .find((r) => r.startsWith("ll_client_org="))
                  ?.split("=")[1],
                body,
              }),
            });
            const data = await res.json();
            if (data.ok) {
              input.value = "";
              alert("Message sent ✅");
            } else {
              alert("Failed: " + data.error);
            }
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}

