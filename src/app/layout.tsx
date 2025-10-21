import type { Metadata } from 'next';
import './globals.css';
import BuildInfo from '@/components/BuildInfo';
import { Toaster } from 'react-hot-toast';
import PWARegistration from '@/components/PWARegistration';

export const metadata: Metadata = {
  title: 'LeadLocker - Lead Management',
  description: 'Manage your leads with SMS alerts and daily summaries',
  manifest: '/manifest.json',
  themeColor: '#2563EB',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LeadLocker',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563EB" />
        <link rel="icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        {children}
        <BuildInfo />
        <Toaster position="top-right" />
        <PWARegistration />
      </body>
    </html>
  );
}

