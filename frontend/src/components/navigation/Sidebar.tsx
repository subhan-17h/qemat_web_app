'use client';

import type { CSSProperties, MouseEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bot, Heart, Home, Search, Settings, User } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { storeIds } from '@/lib/mock-data';
import { getRoutePresentation, primaryNavItems, type PrimaryNavKey } from '@/lib/route-presentation';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';

const primaryNavIcons: Record<PrimaryNavKey, typeof Home> = {
  home: Home,
  search: Search,
  favorites: Heart,
  assistant: Bot,
  profile: User
};

const desktopSidebarPrimaryNavItems = primaryNavItems.filter((item) => item.key !== 'profile');

const sortOptions = [
  { id: 'matchPriority', label: 'Relevance' },
  { id: 'priceAsc', label: 'Price Low-High' },
  { id: 'priceDesc', label: 'Price High-Low' },
  { id: 'nameAsc', label: 'Name A-Z' }
] as const;

function isModifiedClick(event: MouseEvent<HTMLElement>) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function resolveSelectedStore(param: string | null) {
  if (!param) return 'All Stores';
  const match = storeIds.find((item) => item.toLowerCase() === param.toLowerCase());
  return match ?? 'All Stores';
}

function resolveSort(param: string | null) {
  if (!param) return 'matchPriority';
  const match = sortOptions.find((item) => item.id === param);
  return (match?.id ?? 'matchPriority') as (typeof sortOptions)[number]['id'];
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAppStore();
  const [indicatorStyle, setIndicatorStyle] = useState<CSSProperties>({ opacity: 0 });
  const navButtonRefs = useRef(new Map<PrimaryNavKey, HTMLAnchorElement>());
  const presentation = getRoutePresentation(pathname);
  const activePrimaryKey = presentation.primaryNavKey;
  const isSearchListing = pathname === '/search';
  const selectedStore = resolveSelectedStore(searchParams.get('store'));
  const selectedSort = resolveSort(searchParams.get('sort'));
  const userDisplayName = user?.name?.trim() || (user?.email ? user.email.split('@')[0] : 'Guest User');

  const registerPrimaryButton = useCallback(
    (key: PrimaryNavKey) => (node: HTMLAnchorElement | null) => {
      if (node) {
        navButtonRefs.current.set(key, node);
      } else {
        navButtonRefs.current.delete(key);
      }
    },
    []
  );

  useEffect(() => {
    if (isSearchListing) {
      setIndicatorStyle({ opacity: 0 });
      return;
    }

    const syncIndicator = () => {
      const activeButton = navButtonRefs.current.get(activePrimaryKey);
      if (!activeButton) {
        setIndicatorStyle({ opacity: 0 });
        return;
      }

      setIndicatorStyle({
        width: `${activeButton.offsetWidth}px`,
        height: `${activeButton.offsetHeight}px`,
        transform: `translate3d(${activeButton.offsetLeft}px, ${activeButton.offsetTop}px, 0)`,
        opacity: 1
      });
    };

    syncIndicator();
    window.addEventListener('resize', syncIndicator);
    return () => {
      window.removeEventListener('resize', syncIndicator);
    };
  }, [activePrimaryKey, isSearchListing, pathname, user]);

  const applySearchFilter = (key: 'store' | 'sort', value: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    const defaultValue = key === 'store' ? 'All Stores' : 'matchPriority';

    if (value === defaultValue) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }

    const nextHref = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;
    router.replace(nextHref, { scroll: false });
  };

  const goHome = () => {
    const docWithTransition = document as Document & {
      startViewTransition?: (callback: () => void) => { finished: Promise<void> };
    };

    if (!docWithTransition.startViewTransition) {
      router.push('/');
      return;
    }

    const root = document.documentElement;
    root.setAttribute('data-tab-direction', 'left');
    const transition = docWithTransition.startViewTransition(() => {
      router.push('/');
    });
    transition.finished.finally(() => {
      root.removeAttribute('data-tab-direction');
    });
  };

  return (
    <aside className={cn('desktop-sidebar hidden lg:block', isSearchListing ? 'lg:w-[300px] xl:w-[320px]' : 'lg:w-[90px] xl:w-[280px]')}>
      <div className="desktop-sidebar-panel sticky top-[var(--desktop-top-nav-height)] h-[calc(var(--app-dvh)-var(--desktop-top-nav-height)-0.75rem)] px-3 pb-3">
        <div className="desktop-sidebar-shell flex h-full flex-col rounded-[1.55rem] border border-white/70 bg-white/78 p-3 backdrop-blur-2xl">
          {isSearchListing ? (
            <div className="flex h-full flex-col">
              <button
                aria-label="Go home"
                onClick={goHome}
                className="mb-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 text-sm font-semibold text-white shadow-[0_14px_24px_-18px_rgba(16,185,129,0.96)] transition-all hover:-translate-y-0.5 hover:from-emerald-500 hover:to-emerald-500"
              >
                <Home size={16} />
                Home
              </button>

              <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto pr-1">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Store</p>
                  <div className="space-y-1.5">
                    {storeIds.map((store) => {
                      const active = selectedStore === store;
                      return (
                        <button
                          key={store}
                          onClick={() => applySearchFilter('store', store)}
                          className={cn(
                            'w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition-all',
                            active
                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_12px_22px_-18px_rgba(16,185,129,0.95)]'
                              : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/85'
                          )}
                        >
                          {store}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Sort</p>
                  <div className="space-y-1.5">
                    {sortOptions.map((option) => {
                      const active = selectedSort === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => applySearchFilter('sort', option.id)}
                          className={cn(
                            'w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition-all',
                            active
                              ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-[0_12px_22px_-18px_rgba(14,165,233,0.95)]'
                              : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/85'
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  const nextParams = new URLSearchParams(searchParams.toString());
                  nextParams.delete('store');
                  nextParams.delete('sort');
                  const nextHref = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;
                  router.replace(nextHref, { scroll: false });
                }}
                className="mt-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <nav className="relative space-y-1.5">
                <span className="desktop-sidebar-indicator" style={indicatorStyle} aria-hidden />
                {desktopSidebarPrimaryNavItems.map((link, index) => {
                  const active = link.key === activePrimaryKey;
                  const destinationPath = link.href.split('?')[0];
                  const isCurrentLocation = pathname === destinationPath;
                  const Icon = primaryNavIcons[link.key];

                  return (
                    <Link
                      key={link.key}
                      ref={registerPrimaryButton(link.key)}
                      href={link.href}
                      onClick={(event) => {
                        if (isCurrentLocation || isModifiedClick(event)) {
                          if (isCurrentLocation) event.preventDefault();
                          return;
                        }

                        const docWithTransition = document as Document & {
                          startViewTransition?: (callback: () => void) => { finished: Promise<void> };
                        };
                        if (!docWithTransition.startViewTransition) return;

                        event.preventDefault();
                        const currentIndex = desktopSidebarPrimaryNavItems.findIndex((item) => item.key === activePrimaryKey);
                        const root = document.documentElement;
                        root.setAttribute('data-tab-direction', index > currentIndex ? 'right' : 'left');
                        const transition = docWithTransition.startViewTransition(() => {
                          router.push(link.href);
                        });
                        transition.finished.finally(() => {
                          root.removeAttribute('data-tab-direction');
                        });
                      }}
                      className={cn(
                        'desktop-sidebar-link relative z-[1] flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                        active ? 'text-white' : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      <Icon size={18} />
                      <span className="hidden xl:inline">{link.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-4 flex flex-1 flex-col border-t border-gray-200/80 pt-4">
                <Link
                  href="/profile"
                  className="mt-auto rounded-2xl border border-gray-200/80 bg-white/85 p-2.5 backdrop-blur-md transition-colors hover:bg-white"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-slate-700">
                      <User size={19} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-[#1F2933]">{userDisplayName}</p>
                      <p className="text-xs text-[#6B7280]">Profile</p>
                    </div>
                    <span className="grid h-8 w-8 place-items-center rounded-full border border-gray-200 bg-white text-slate-600">
                      <Settings size={14} />
                    </span>
                  </div>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .desktop-sidebar-shell {
          box-shadow:
            0 22px 38px -32px rgba(15, 23, 42, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        .desktop-sidebar-link {
          transform: translateY(0);
          transition:
            transform 220ms cubic-bezier(0.2, 0.88, 0.22, 1),
            color 220ms ease;
        }

        .desktop-sidebar-link:hover {
          transform: translateY(-1px);
        }

        .desktop-sidebar-indicator {
          position: absolute;
          top: 0;
          left: 0;
          border-radius: 0.75rem;
          background: linear-gradient(142deg, #34d399 0%, #10b981 58%, #059669 100%);
          box-shadow:
            0 14px 22px -18px rgba(16, 185, 129, 0.88),
            inset 0 1px 0 rgba(255, 255, 255, 0.46);
          transition:
            transform 420ms cubic-bezier(0.2, 0.9, 0.2, 1),
            width 420ms cubic-bezier(0.2, 0.9, 0.2, 1),
            height 420ms cubic-bezier(0.2, 0.9, 0.2, 1),
            opacity 220ms ease;
          pointer-events: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .desktop-sidebar-link,
          .desktop-sidebar-link:hover,
          .desktop-sidebar-indicator {
            transition: none;
            transform: none;
          }
        }
      `}</style>
    </aside>
  );
}
