import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Noto_Nastaliq_Urdu, Poppins } from 'next/font/google';

import { Chrome } from '@/components/navigation/Chrome';
import { Providers } from '@/app/providers';

import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700']
});

const urdu = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  variable: '--font-urdu',
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: 'Qemat Web App',
  description: 'Community-driven grocery and pharma price comparison app.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} ${urdu.variable} font-[var(--font-sans)]`}>
        <Providers>
          <Chrome>{children}</Chrome>
        </Providers>
      </body>
    </html>
  );
}
