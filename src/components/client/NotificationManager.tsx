'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

// ========================================
// TYPE DEFINITIONS
// ========================================

interface NotificationManagerProps {
  orgId: string;
}

type SubscriptionState = 'unknown' | 'unsupported' | 'denied' | 'unsubscribed' | 'subscribed' | 'loading';

// ========================================
// NOTIFICATION MANAGER COMPONENT
// ========================================

/**
 * NotificationManager Component
 * 
 * Manages push notification subscriptions for the client portal.
 * 
 * Features:
 * - Requests browser notification permission
 * - Registers push subscription via Web Push API
 * - Sends subscription to backend
 * - Displays subscription status
 * - Allows unsubscribe
 * 
 * Usage:
 * <NotificationManager orgId="demo-org" />
 */
export default function NotificationManager({ orgId }: NotificationManagerProps) {
  const [state, setState] = useState<SubscriptionState>('unknown');
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // ========================================
  // INITIALIZATION
  // ========================================

  useEffect(() => {
    async function init() {
      console.log('[NotificationManager] Initializing...');
      
      // Check ServiceWorker API
      if (!('serviceWorker' in navigator)) {
        console.error('❌ ServiceWorker API not available.');
        setState('unsupported');
        setError('ServiceWorker not supported in this browser');
        return;
      }
      
      // Check PushManager API
      if (!('PushManager' in window)) {
        console.error('❌ PushManager API not available.');
        setState('unsupported');
        setError('Push notifications not supported in this browser');
        return;
      }

      console.log('[NotificationManager] APIs available: ServiceWorker ✓, PushManager ✓');

      try {
        // Wait for service worker to be ready
        console.log('[NotificationManager] Waiting for service worker...');
        const reg = await navigator.serviceWorker.ready;
        console.log('[NotificationManager] Service worker ready:', reg.scope);

        // Check current permission
        const perm = Notification.permission;
        console.log('[NotificationManager] Current permission:', perm);

        if (perm === 'denied') {
          setState('denied');
          setError('Notification permission denied');
          return;
        }

        // Check if already subscribed
        const subscription = await reg.pushManager.getSubscription();
        if (subscription) {
          console.log('[NotificationManager] Already subscribed');
          setState('subscribed');
        } else {
          console.log('[NotificationManager] Ready to subscribe');
          setState('unsubscribed');
        }

      } catch (err: any) {
        console.error('❌ Init error:', err);
        setState('unsubscribed');
        setError(err.message);
      }
    }
    
    init();
  }, []);

  // ========================================
  // SUBSCRIBE TO PUSH NOTIFICATIONS
  // ========================================

  const subscribe = async () => {
    try {
      setState('loading');
      setError(null);

      console.log('[NotificationManager] Starting subscription...');

      // Request permission
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        console.log('[NotificationManager] Permission not granted:', permission);
        setState('denied');
        setError('Notification permission denied');
        return;
      }

      console.log('[NotificationManager] Permission granted');

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      console.log('[NotificationManager] Service worker ready');

      // Get VAPID public key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        console.error('[NotificationManager] VAPID public key not configured');
        setState('unsubscribed');
        setError('Push notifications not configured');
        return;
      }

      // Subscribe to push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      console.log('[NotificationManager] Browser subscription created');

      // Send subscription to backend
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId,
          subscription: subscription.toJSON(),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save subscription');
      }

      console.log('[NotificationManager] Subscription saved to backend');

      setState('subscribed');
      showSuccessToast('✅ Notifications enabled!');

    } catch (err: any) {
      console.error('[NotificationManager] Subscribe error:', err);
      setError(err.message);
      setState('unsubscribed');
      showErrorToast('Failed to enable notifications');
    }
  };

  // ========================================
  // UNSUBSCRIBE FROM PUSH NOTIFICATIONS
  // ========================================

  const unsubscribe = async () => {
    try {
      setState('loading');
      setError(null);

      console.log('[NotificationManager] Unsubscribing...');

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get current subscription
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        console.log('[NotificationManager] No subscription to remove');
        setState('unsubscribed');
        return;
      }

      const endpoint = subscription.endpoint;

      // Unsubscribe from browser
      const success = await subscription.unsubscribe();

      if (!success) {
        throw new Error('Failed to unsubscribe from browser');
      }

      console.log('[NotificationManager] Browser unsubscribed');

      // Remove subscription from backend
      const response = await fetch('/api/notifications/subscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId,
          endpoint,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        console.warn('[NotificationManager] Backend removal warning:', data.error);
        // Continue anyway - browser is unsubscribed
      }

      console.log('[NotificationManager] Unsubscribed successfully');

      setState('unsubscribed');
      showSuccessToast('🔕 Notifications disabled');

    } catch (err: any) {
      console.error('[NotificationManager] Unsubscribe error:', err);
      setError(err.message);
      showErrorToast('Failed to disable notifications');
      
      // Still try to update state
      setState('unsubscribed');
    }
  };

  // ========================================
  // TOAST HELPERS
  // ========================================

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const showErrorToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // ========================================
  // RENDER
  // ========================================

  // Unsupported browser
  if (state === 'unsupported') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-700">
              Notifications Not Supported
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Your browser doesn&apos;t support push notifications.
              {error && <><br /><span className="text-red-600">{error}</span></>}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Please use Chrome/Firefox on localhost or deploy to HTTPS.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Permission denied
  if (state === 'denied') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Notifications Blocked
            </p>
            <p className="text-xs text-red-600 mt-1">
              You&apos;ve denied notification permissions. Enable them in your browser settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Icon and Status */}
          <div className="flex items-start gap-3 flex-1">
            {state === 'subscribed' ? (
              <div className="p-2 bg-green-100 rounded-lg">
                <Bell className="h-5 w-5 text-green-600" />
              </div>
            ) : (
              <div className="p-2 bg-gray-100 rounded-lg">
                <BellOff className="h-5 w-5 text-gray-500" />
              </div>
            )}

            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">
                Push Notifications
              </h3>
              
              {state === 'subscribed' && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Enabled - You&apos;ll receive updates
                </p>
              )}

              {state === 'unsubscribed' && (
                <p className="text-xs text-gray-500 mt-1">
                  Get notified about new leads and updates
                </p>
              )}

              {state === 'loading' && (
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Processing...
                </p>
              )}

              {error && (
                <p className="text-xs text-red-600 mt-1">
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div>
            {state === 'subscribed' && (
              <button
                onClick={unsubscribe}
                className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Disable
              </button>
            )}

            {state === 'unsubscribed' && (
              <button
                onClick={subscribe}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Bell className="h-3 w-3" />
                Enable
              </button>
            )}
            
            {state === 'loading' && (
              <button
                disabled
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md opacity-50 cursor-not-allowed flex items-center gap-1"
              >
                <Loader2 className="h-3 w-3 animate-spin" />
                Processing...
              </button>
            )}
          </div>
        </div>

        {/* Additional Info */}
        {state === 'unsubscribed' && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              <span className="font-medium">What you&apos;ll receive:</span> Instant notifications when new leads arrive, status changes, and daily summaries.
            </p>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom">
          <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
            <p className="text-sm font-medium">{toastMessage}</p>
          </div>
        </div>
      )}
    </>
  );
}

// ========================================
// HELPER FUNCTION
// ========================================

/**
 * Convert base64 VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

