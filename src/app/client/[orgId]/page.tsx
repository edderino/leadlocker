import { cookies } from 'next/headers';
import ClientDashboard from '@/components/client/ClientDashboard';
import NotificationManager from '@/components/client/NotificationManager';
import AISuggestions from '@/components/client/AISuggestions';
import AdvancedAnalyticsWrapper from '@/components/client/AdvancedAnalyticsWrapper';
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

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params;
  const fetchedAt = new Date();

  // Gate access if REQUIRE_CLIENT_INVITE is enabled
  const requireInvite = process.env.REQUIRE_CLIENT_INVITE === 'true';
  
  if (requireInvite) {
    const cookieStore = await cookies();
    const clientOrgCookie = cookieStore.get('ll_client_org');
    
    if (!clientOrgCookie || clientOrgCookie.value !== orgId) {
      console.log('[ClientPortal] Access denied - missing or invalid cookie for orgId:', orgId);
      
      return (
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow-md rounded-lg border border-gray-200 p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Access Required
              </h1>
              <p className="text-gray-600 mb-4">
                You need an invite link to access this organization&apos;s dashboard.
              </p>
              <div className="bg-gray-50 rounded p-4 text-sm text-gray-700">
                <p className="font-medium mb-1">Organization:</p>
                <p className="font-mono text-xs">{orgId}</p>
              </div>
              <p className="text-sm text-gray-500 mt-6">
                Ask your provider to send a fresh invite link to access this portal.
              </p>
            </div>
          </div>
        </main>
      );
    }
    
    console.log('[ClientPortal] Access granted for orgId:', orgId);
  }

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
          <h1 className="text-2xl font-semibold text-gray-900">Client Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Organization: <span className="font-mono font-medium">{orgId}</span>
          </p>
        </div>

        {/* Push Notification Manager */}
        <div className="mb-6">
          <NotificationManager orgId={orgId} />
        </div>

        {/* AI Suggestions */}
        <div className="mb-6">
          <AISuggestions orgId={orgId} />
        </div>

        {/* Advanced Analytics Dashboard */}
        <div className="mb-6">
          <AdvancedAnalyticsWrapper orgId={orgId} />
        </div>

        {/* Dashboard Content */}
        <ClientDashboard leads={leads} orgId={orgId} />

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Last updated {relativeTime(fetchedAt)}
          </p>
        </div>
      </div>
    </main>
  );
}

