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
  title: 'Qemat Web App',
  description: 'Community-driven grocery and pharma price comparison app.'
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
