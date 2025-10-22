'use client';

import React from 'react';
import NotificationManager from './NotificationManager';
import AISuggestions from './AISuggestions';
import AdvancedAnalytics from './AdvancedAnalytics';

interface DashboardClientRootProps {
  orgId: string;
}

export default function DashboardClientRoot({ orgId }: DashboardClientRootProps) {
  return (
    <>
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
        <AdvancedAnalytics orgId={orgId} />
      </div>
    </>
  );
}
