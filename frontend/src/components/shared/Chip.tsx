'use client';

import { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function Chip({ selected, className, children, ...props }: ChipProps) {
  return (
    <button
      className={cn(
        'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60',
        selected ? 'border-brand-700 bg-brand-700 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
