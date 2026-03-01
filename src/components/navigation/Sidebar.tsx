'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bot, Heart, Home, PlusCircle, User } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';

const links = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/ai-assistant', label: 'AI Assistant', icon: Bot },
  { href: '/profile', label: 'Profile', icon: User }
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAppStore();

  return (
    <aside className="hidden h-screen border-r border-gray-200 bg-white/90 px-3 py-4 lg:sticky lg:top-0 lg:flex lg:w-20 lg:flex-col xl:w-64">
      <div className="mb-8 flex items-center gap-3 px-1">
        <Image src="/assets/logo/logo.png" width={36} height={36} alt="Qemat" className="rounded-full" />
        <div className="hidden xl:block">
          <p className="text-lg font-bold text-gray-900">Qemat</p>
          <p className="text-xs text-gray-500">Price Compare</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {links.map((link) => {
          const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium',
                active ? 'bg-green-50 text-brand-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon size={18} />
              <span className="hidden xl:inline">{link.label}</span>
            </Link>
          );
        })}

        {user ? (
          <Link
            href="/add-price"
            className={cn(
              'mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium',
              pathname.startsWith('/add-price') ? 'bg-green-50 text-brand-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <PlusCircle size={18} />
            <span className="hidden xl:inline">Add Price</span>
          </Link>
        ) : null}
      </nav>
    </aside>
  );
}
