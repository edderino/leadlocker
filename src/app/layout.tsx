import type { Metadata } from 'next';
import './globals.css';
import BuildInfo from '@/components/BuildInfo';

export const metadata: Metadata = {
  title: 'LeadLocker - Lead Management',
  description: 'Manage your leads with SMS alerts and daily summaries',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <BuildInfo />
      </body>
    </html>
  );
}

