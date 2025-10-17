import type { Metadata } from 'next';
import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}

