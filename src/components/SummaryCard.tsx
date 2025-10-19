import { supabase } from '@/libs/supabaseClient';
import SendSummaryButton from './SendSummaryButton';

async function getTodayStats() {
  const userId = 'c96933ac-8a2b-484b-b9df-8e25d04e7f29';
  
  // Query leads from today (midnight to now)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());

  if (error) {
    console.error('Error fetching today stats:', error);
    return {
      needsAttention: 0,
      reconciled: 0,
    };
  }

  const needsAttention = leads?.filter((l) => l.status === 'NEW').length || 0;
  const reconciled = leads?.filter((l) => l.status === 'APPROVED' || l.status === 'COMPLETED').length || 0;

  return {
    needsAttention,
    reconciled,
  };
}

export default async function SummaryCard() {
  const stats = await getTodayStats();

  return (
    <div className="rounded-xl border p-4 shadow-sm bg-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Today</h3>
        <SendSummaryButton />
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Needs Attention Chip */}
        <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <span className="mr-1">Needs Attention:</span>
          <span className="font-bold">{stats.needsAttention}</span>
        </div>

        {/* Reconciled Chip */}
        <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <span className="mr-1">Reconciled:</span>
          <span className="font-bold">{stats.reconciled}</span>
        </div>
      </div>
    </div>
  );
}

