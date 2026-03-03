'use client';

import { type InputHTMLAttributes, type ReactNode } from 'react';

import { useTheme } from '@/components/theme/useTheme';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  startSlot?: ReactNode;
  endSlot?: ReactNode;
  wrapperClassName?: string;
}

export function Input({ label, className, error, startSlot, endSlot, wrapperClassName, ...props }: InputProps) {
  const { isGlass } = useTheme();

  return (
    <label className="flex w-full flex-col gap-2 text-sm">
      {label ? <span className="font-medium text-gray-700">{label}</span> : null}
      <span
        className={cn(
          'flex h-12 items-center gap-2 overflow-hidden rounded-xl border px-3 focus-within:ring-2 focus-within:ring-brand-400/60',
          isGlass ? 'rounded-2xl border-white/40 bg-white/30 backdrop-blur-md' : 'border-gray-200 bg-white',
          wrapperClassName
        )}
      >
        {startSlot ? <span className="text-gray-500">{startSlot}</span> : null}
        <input
          className={cn('h-full flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400', className)}
          {...props}
        />
        {endSlot ? <span className="text-gray-500">{endSlot}</span> : null}
      </span>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
