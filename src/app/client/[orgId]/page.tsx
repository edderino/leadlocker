import ClientSummary from '@/components/client/ClientSummary';
import ClientLeadList from '@/components/client/ClientLeadList';
import { relativeTime } from '@/libs/time';

interface PageProps {
  params: {
    orgId: string;
  };
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  description: string | null;
  status: 'NEW' | 'APPROVED' | 'COMPLETED';
  created_at: string;
}

interface ApiResponse {
  success: boolean;
  orgId?: string;
  total?: number;
  leads?: Lead[];
  error?: string;
}

async function fetchClientLeads(orgId: string): Promise<ApiResponse> {
  try {
    const clientToken = process.env.CLIENT_PORTAL_SECRET;
    
    if (!clientToken) {
      console.error('[ClientPortal] CLIENT_PORTAL_SECRET not configured');
      return { success: false, error: 'Configuration error' };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/client/leads?orgId=${encodeURIComponent(orgId)}`;

    console.log('[ClientPortal] Fetching leads for orgId:', orgId);

    const res = await fetch(url, {
      headers: {
        'x-client-token': clientToken,
      },
      cache: 'no-store', // Always fetch fresh data
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[ClientPortal] API request failed:', res.status, errorData);
      return { success: false, error: errorData.error || 'Failed to fetch leads' };
    }

    const data = await res.json();
    return data;

  } catch (error: any) {
    console.error('[ClientPortal] Unexpected error:', error);
    return { success: false, error: 'Failed to connect to server' };
  }
}

export default async function ClientPortalPage({ params }: PageProps) {
  const { orgId } = params;
  const fetchedAt = new Date();

  const response = await fetchClientLeads(orgId);

  if (!response.success || !response.leads) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Client Portal</h1>
            <p className="mt-2 text-sm text-gray-600">
              Organization: <span className="font-mono">{orgId}</span>
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading leads
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {response.error || 'Unable to fetch leads. Please try again later.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const leads = response.leads || [];

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Client Portal</h1>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              Organization: <span className="font-mono font-medium">{orgId}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1 sm:mt-0">
              Last updated: {relativeTime(fetchedAt)}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <ClientSummary leads={leads} />

        {/* Leads List */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Recent Leads ({leads.length})
          </h2>
          <ClientLeadList leads={leads} />
        </div>
      </div>
    </main>
  );
}

