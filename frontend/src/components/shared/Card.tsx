'use client';

import { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200/55 bg-white p-4 shadow-[0_18px_28px_-24px_rgba(15,23,42,0.42)] transition-all',
        className
      )}
      {...props}
    />
  );
}
