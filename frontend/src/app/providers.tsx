'use client';

import type { ReactNode } from 'react';

import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { AppStoreProvider } from '@/store/app-store';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AppStoreProvider>{children}</AppStoreProvider>
    </ThemeProvider>
  );
}
