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
      total: 0,
      byStatus: { NEW: 0, APPROVED: 0, COMPLETED: 0 },
    };
  }

  const total = leads?.length || 0;
  const newCount = leads?.filter((l) => l.status === 'NEW').length || 0;
  const approvedCount = leads?.filter((l) => l.status === 'APPROVED').length || 0;
  const completedCount = leads?.filter((l) => l.status === 'COMPLETED').length || 0;

  return {
    total,
    byStatus: {
      NEW: newCount,
      APPROVED: approvedCount,
      COMPLETED: completedCount,
    },
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
        {/* Total Chip */}
        <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          <span className="mr-1">Total:</span>
          <span className="font-bold">{stats.total}</span>
        </div>

        {/* NEW Chip */}
        <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          <span className="mr-1">NEW:</span>
          <span className="font-bold">{stats.byStatus.NEW}</span>
        </div>

        {/* APPROVED Chip */}
        <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <span className="mr-1">APPROVED:</span>
          <span className="font-bold">{stats.byStatus.APPROVED}</span>
        </div>

        {/* COMPLETED Chip */}
        <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
          <span className="mr-1">COMPLETED:</span>
          <span className="font-bold">{stats.byStatus.COMPLETED}</span>
        </div>
      </div>
    </div>
  );
}

