'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { BottomNav } from '@/components/navigation/BottomNav';
import { Sidebar } from '@/components/navigation/Sidebar';
import { useAppStore } from '@/store/app-store';

const authRoutes = ['/sign-in', '/sign-up'];

export function Chrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { loadingProducts } = useAppStore();
  const hideNavigation = authRoutes.some((route) => pathname.startsWith(route));

  return (
    <>
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        {!hideNavigation ? <Sidebar /> : null}
        <main className="w-full pb-28 lg:pb-0">{children}</main>
      </div>
      {!hideNavigation ? <BottomNav /> : null}

      {loadingProducts ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90">
          <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-brand-700 border-t-transparent" />
            <p className="text-sm font-medium text-gray-700">Loading Qemat...</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
