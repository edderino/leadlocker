'use client';

import { useEffect } from 'react';

export default function PWARegistration() {
  useEffect(() => {
    // Only register service worker in production
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      console.log('[PWA] Registering service worker...');
      
      navigator.serviceWorker
        .register('/sw.js?v=4', { scope: '/' })
        .then((registration) => {
          console.log('✅ Service worker v4 registered successfully');
          console.log('[PWA] Scope:', registration.scope);
          console.log('[PWA] Installing:', registration.installing);
          console.log('[PWA] Active:', registration.active);
          
          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute
        })
        .catch((error) => {
          console.error('❌ SW registration failed:', error);
          console.error('[PWA] Error details:', error.message);
        });
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[PWA] Service Worker disabled in development mode');
      console.log('[PWA] Use production build (npm run build && npm run start) to enable push notifications');
    }
  }, []);

  return null; // This component doesn't render anything
}

