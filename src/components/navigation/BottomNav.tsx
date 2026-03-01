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
    <nav className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 lg:hidden">
      <div className="rounded-[1.65rem] border border-white/45 bg-white/34 px-1.5 py-1.5 shadow-[0_22px_48px_-30px_rgba(15,23,42,0.38),0_10px_20px_-16px_rgba(15,23,42,0.24)] backdrop-blur-2xl">
        <ul className="grid grid-cols-4 gap-0.5">
          {items.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center gap-0.5 rounded-xl px-1.5 py-1 text-[11px] font-medium transition-colors',
                    active ? 'bg-white/38 text-brand-500' : 'text-gray-600'
                  )}
                >
                  <Icon size={16} />
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
