'use client';

import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { BottomNav } from '@/components/navigation/BottomNav';
import { DesktopTopNav } from '@/components/navigation/DesktopTopNav';
import { Sidebar } from '@/components/navigation/Sidebar';
import { getRoutePresentation } from '@/lib/route-presentation';
import { cn } from '@/lib/utils';

const authRoutes = ['/sign-in', '/sign-up'];
const mainNavRoutes = new Set(['/', '/favorites', '/ai-assistant', '/profile']);

export function Chrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const routePresentation = getRoutePresentation(pathname);
  const hideMobileNavigation = authRoutes.some((route) => pathname.startsWith(route));
  const showBottomNav = !hideMobileNavigation && mainNavRoutes.has(pathname);

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
      {routePresentation.showDesktopTopNav ? <DesktopTopNav /> : null}
      <div className="app-shell mx-auto flex w-full max-w-[1680px]">
        {routePresentation.showDesktopSidebar ? (
          <Suspense fallback={null}>
            <Sidebar />
          </Suspense>
        ) : null}
        <main
          className={cn(
            'w-full min-w-0 lg:pb-0',
            pathname === '/'
              ? 'overflow-hidden pb-16 lg:overflow-y-auto lg:pb-8'
              : pathname.startsWith('/search')
                ? 'app-scroll pb-8'
                : showBottomNav
                  ? 'app-scroll pb-28'
                  : 'app-scroll pb-8'
          )}
        >
          <div className="min-h-full lg:px-1 lg:pb-2 lg:pt-[calc(var(--desktop-top-nav-height)+0.25rem)] xl:px-2">
            {children}
          </div>
        </main>
      </div>
      {showBottomNav ? <BottomNav /> : null}
    </>
  );
}
