'use client';

import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';

export function DesktopSectionHeader({
  title,
  subtitle,
  showBack,
  rightAction,
  className
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  className?: string;
}) {
  const router = useRouter();

  return (
    <div
      className={cn(
        'desktop-section-header hidden items-center justify-between gap-4 rounded-2xl border border-gray-200/75 bg-white/88 px-4 py-3 shadow-[0_18px_32px_-28px_rgba(15,23,42,0.5)] backdrop-blur-xl lg:flex',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {showBack ? (
          <button
            aria-label="Go back"
            onClick={() => router.back()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50"
          >
            <ChevronLeft size={18} />
          </button>
        ) : null}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-gray-900">{title}</h1>
          {subtitle ? <p className="truncate text-sm text-gray-500">{subtitle}</p> : null}
        </div>
      </div>
      {rightAction ? <div className="flex shrink-0 items-center gap-2">{rightAction}</div> : null}
    </div>
  );
}
