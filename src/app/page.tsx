import SummaryCard from '@/components/SummaryCard';
import LeadForm from '@/components/LeadForm';
import LeadList from '@/components/LeadList';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">LeadLocker</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your leads with real-time SMS alerts
            </p>
          </div>

          {/* Daily Summary */}
          <div className="mb-6">
            <SummaryCard />
          </div>

          {/* Lead Creation Form */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Add New Lead
            </h2>
            <LeadForm />
          </div>
          
          {/* Lead List */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Recent Leads
            </h2>
            <LeadList />
          </div>
        </div>
      </div>
    </main>
  );
}

