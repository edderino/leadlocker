'use client';

import WorkspaceLayout from './workspace/WorkspaceLayout';

type Lead = {
  id: string;
  name: string;
  phone: string;
  source: string;
  description: string | null;
  status: 'NEW' | 'APPROVED' | 'COMPLETED';
  created_at: string;
};

interface ClientDashboardV5Props {
  leads: Lead[];
  orgId: string;
}

export default function ClientDashboardV5({ leads, orgId }: ClientDashboardV5Props) {
  return <WorkspaceLayout leads={leads} orgId={orgId} />;
}

