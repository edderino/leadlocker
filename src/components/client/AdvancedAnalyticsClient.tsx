'use client';

import React from 'react';
import AdvancedAnalytics from './AdvancedAnalytics';

interface AdvancedAnalyticsClientProps {
  orgId: string;
}

export default function AdvancedAnalyticsClient(props: AdvancedAnalyticsClientProps) {
  return <AdvancedAnalytics {...props} />;
}
