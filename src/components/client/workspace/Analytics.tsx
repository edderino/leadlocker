'use client';

import { BarChart3 } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-12 text-center">
      <div className="inline-flex p-4 rounded-full bg-white/10 mb-4">
        <BarChart3 className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-white text-xl font-semibold mb-2">Advanced Analytics</h3>
      <p className="text-gray-400 max-w-md mx-auto">
        Detailed charts and reports will appear here once you have more lead data. Keep adding leads to unlock insights.
      </p>
    </div>
  );
}

