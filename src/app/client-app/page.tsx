import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Smartphone, TrendingUp, Shield, Zap } from 'lucide-react';

export default async function ClientAppPage() {
  // Auto-redirect if already authenticated
  const cookieStore = await cookies();
  const clientOrgCookie = cookieStore.get('ll_client_org');
  
  if (clientOrgCookie?.value) {
    redirect(`/client/${clientOrgCookie.value}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6">
            <span className="text-white text-3xl font-bold">LL</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            LeadLocker Client App
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Access your leads, view analytics, and stay connected — anytime, anywhere.
          </p>
          
          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              <p className="font-medium">Need access?</p>
              <p className="text-xs mt-1">Ask your provider to send you an invite link.</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Mobile-First</h3>
                <p className="text-sm text-gray-600">
                  Access your dashboard from any device. Optimized for mobile with offline support.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Real-Time Analytics</h3>
                <p className="text-sm text-gray-600">
                  Track your leads with live charts, trends, and performance metrics.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Secure Access</h3>
                <p className="text-sm text-gray-600">
                  Your data is protected with time-limited invites and encrypted sessions.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Lightning Fast</h3>
                <p className="text-sm text-gray-600">
                  Instant updates, quick navigation, and optimized performance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PWA Install Tip */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h3 className="font-semibold text-blue-900 mb-2">
            📱 Install as App
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            Add LeadLocker to your home screen for quick access and offline functionality.
          </p>
          <p className="text-xs text-blue-600">
            Look for &quot;Add to Home Screen&quot; or &quot;Install App&quot; in your browser menu.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>LeadLocker Client Portal • Secure Lead Management</p>
          <p className="mt-2">
            <Link href="/" className="text-blue-600 hover:text-blue-800 hover:underline">
              Admin Dashboard
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

