'use client';

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

  return (
    <nav
      className="fixed left-1/2 z-40 w-[calc(100%-5rem)] max-w-[22rem] -translate-x-1/2 lg:hidden"
      style={{ bottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="rounded-[2rem] border border-white/15 bg-black/30 px-1 py-0.5 backdrop-blur-lg">
        <ul className="grid grid-cols-4 gap-0">
          {items.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center gap-0 rounded-xl px-1 py-0.5 text-[9px] font-medium transition-colors',
                    active ? 'text-white' : 'text-gray-200'
                  )}
                >
                  <span
                    className={cn(
                      'relative grid h-9 w-9 place-items-center rounded-full',
                      active
                        ? 'bg-brand-500 text-black'
                        : 'bg-black/50 text-gray-100'
                    )}
                  >
                    <Icon size={17} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
