'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { BottomNav } from '@/components/navigation/BottomNav';
import { Sidebar } from '@/components/navigation/Sidebar';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';

const authRoutes = ['/sign-in', '/sign-up'];

export function Chrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { loadingProducts } = useAppStore();
  const hideNavigation = authRoutes.some((route) => pathname.startsWith(route));

  useEffect(() => {
    const updateViewportVars = () => {
      if (typeof window === 'undefined') return;

      const vv = window.visualViewport;
      const height = vv?.height ?? window.innerHeight;
      const top = vv?.offsetTop ?? 0;
      const bottomInset = Math.max(window.innerHeight - height - top, 0);

      document.documentElement.style.setProperty('--app-dvh', `${height}px`);
      document.documentElement.style.setProperty('--browser-bar-offset', `${bottomInset}px`);
    };

    updateViewportVars();

    const vv = window.visualViewport;
    vv?.addEventListener('resize', updateViewportVars);
    vv?.addEventListener('scroll', updateViewportVars);
    window.addEventListener('resize', updateViewportVars);
    window.addEventListener('orientationchange', updateViewportVars);

    return () => {
      vv?.removeEventListener('resize', updateViewportVars);
      vv?.removeEventListener('scroll', updateViewportVars);
      window.removeEventListener('resize', updateViewportVars);
      window.removeEventListener('orientationchange', updateViewportVars);
    };
  }, []);

  return (
    <>
      <div className="app-shell mx-auto flex max-w-[1600px]">
        {!hideNavigation ? <Sidebar /> : null}
        <main
          className={cn(
            'w-full lg:pb-0',
            pathname === '/' ? 'overflow-hidden pb-16' : 'app-scroll pb-28'
          )}
        >
          {children}
        </main>
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
