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
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered successfully:', registration.scope);
          
          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[PWA] Service Worker disabled in development mode');
    }
  }, []);

  return null; // This component doesn't render anything
}

