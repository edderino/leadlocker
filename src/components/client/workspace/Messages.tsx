'use client';

import { MessageSquare } from 'lucide-react';

export default function Messages() {
  return (
    <div className="rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-12 text-center">
      <div className="inline-flex p-4 rounded-full bg-white/10 mb-4">
        <MessageSquare className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-white text-xl font-semibold mb-2">Messages Coming Soon</h3>
      <p className="text-gray-400 max-w-md mx-auto">
        Threaded message view will be available in Phase 3. For now, use the Reply button on individual leads.
      </p>
    </div>
  );
}

