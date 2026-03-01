'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';

export function AppBar({
  title,
  showBack,
  rightAction,
  sticky
}: {
  title: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  sticky?: boolean;
}) {
  const router = useRouter();

  return (
    <header
      className={cn(
        'z-40 mt-3 flex h-12 items-center justify-between rounded-[1.25rem] border border-gray-200/65 bg-white/72 px-3.5 shadow-[0_6px_16px_rgba(15,23,42,0.06)] backdrop-blur-xl md:h-14',
        sticky ? 'sticky top-3' : 'relative'
      )}
    >
      <div className="flex w-9 items-center justify-start">
        {showBack ? (
          <button aria-label="Go back" onClick={() => router.back()} className="rounded-full p-2 text-gray-700 hover:bg-gray-100">
            <ChevronLeft size={20} />
          </button>
        ) : (
          <Image src="/assets/logo/logo.png" width={28} height={28} alt="Qemat logo" className="rounded-full" />
        )}
      </div>
      <h1 className="flex-1 truncate px-2 text-left text-lg font-bold text-gray-900 md:text-xl">{title}</h1>
      <div className="flex w-9 items-center justify-end">{rightAction}</div>
    </header>
  );
}
