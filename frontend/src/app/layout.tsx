import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import localFont from 'next/font/local';

import { Chrome } from '@/components/navigation/Chrome';
import { Providers } from '@/app/providers';

import './globals.css';

const urdu = localFont({
  variable: '--font-urdu',
  src: [
    {
      path: '../../public/assets/fonts/Firoz Unicode Firoz Unicode.ttf',
      weight: '400',
      style: 'normal'
    }
  ],
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Qemat',
  description: 'Community-driven grocery and pharma price comparison app.',
  applicationName: 'Qemat',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/assets/logo/logo.png', type: 'image/png' }],
    shortcut: [{ url: '/assets/logo/logo.png', type: 'image/png' }],
    apple: [{ url: '/assets/logo/logo.png', type: 'image/png' }]
  },
  appleWebApp: {
    title: 'Qemat',
    statusBarStyle: 'default',
    capable: true
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${urdu.variable} font-sans`}>
        <Providers>
          <Chrome>{children}</Chrome>
        </Providers>
      </body>
    </html>
  );
}
