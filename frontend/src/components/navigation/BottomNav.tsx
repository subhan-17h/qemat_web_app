'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { Bot, Heart, Home, User } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const items = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/ai-assistant', label: 'Assistant', icon: Bot },
  { href: '/profile', label: 'Profile', icon: User }
];

export function BottomNav() {
  const pathname = usePathname();
  const activeIndex = Math.max(
    items.findIndex((item) => (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href))),
    0
  );

  return (
    <>
      <nav
        className="bottom-nav-shell fixed left-1/2 z-40 w-[calc(100%-5rem)] max-w-[22rem] -translate-x-1/2 lg:hidden"
        style={{ bottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="bottom-nav-frame rounded-[2rem] border border-white/20 bg-black/30 px-1 py-0.5 backdrop-blur-xl">
          <div className="bottom-nav-track relative" style={{ '--active-index': activeIndex } as CSSProperties}>
            <span className="bottom-nav-pill-slot" aria-hidden>
              <span className="bottom-nav-pill" />
            </span>
            <ul className="relative z-10 grid grid-cols-4 gap-0 p-0.5">
              {items.map((item) => {
                const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'group flex flex-col items-center gap-0.5 rounded-[1.15rem] px-1 py-1 text-[10px] font-semibold transition-all duration-300 ease-out',
                        active ? 'text-white' : 'text-gray-200/90 hover:text-white'
                      )}
                    >
                      <span
                        className={cn(
                          'relative grid h-9 w-9 place-items-center rounded-full transition-all duration-300 ease-out',
                          active
                            ? '-translate-y-0.5 scale-105 bg-transparent text-black'
                            : 'scale-95 bg-black/50 text-gray-100'
                        )}
                      >
                        <Icon size={17} className={cn('transition-transform duration-300 ease-out', active ? 'scale-100' : 'scale-[0.96]')} />
                      </span>
                      <span className={cn('transition-all duration-300 ease-out', active ? 'translate-y-0 text-white' : 'translate-y-0.5')}>
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </nav>

      <style jsx>{`
        .bottom-nav-shell {
          animation: bottom-nav-enter 420ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .bottom-nav-frame {
          box-shadow:
            0 16px 28px -20px rgba(15, 23, 42, 0.75),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .bottom-nav-pill-slot {
          position: absolute;
          top: 6px;
          left: 0;
          width: 25%;
          display: flex;
          justify-content: center;
          transform: translate3d(calc(var(--active-index, 0) * 100%), 0, 0);
          transition: transform 450ms cubic-bezier(0.2, 0.9, 0.2, 1);
          pointer-events: none;
        }

        .bottom-nav-pill {
          height: 2.25rem;
          width: 2.25rem;
          border-radius: 9999px;
          background: linear-gradient(140deg, #34d399 0%, #10b981 60%, #059669 100%);
          box-shadow:
            0 10px 24px -14px rgba(16, 185, 129, 0.95),
            inset 0 1px 0 rgba(255, 255, 255, 0.45);
        }

        @keyframes bottom-nav-enter {
          0% {
            opacity: 0;
            transform: translate3d(-50%, 10px, 0);
          }
          100% {
            opacity: 1;
            transform: translate3d(-50%, 0, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .bottom-nav-shell {
            animation: none;
          }

          .bottom-nav-pill-slot {
            transition: none;
          }
        }
      `}</style>
    </>
  );
}
