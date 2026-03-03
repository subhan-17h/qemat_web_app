'use client';

import { ButtonHTMLAttributes } from 'react';

import { useTheme } from '@/components/theme/useTheme';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  className,
  children,
  fullWidth,
  ...props
}: ButtonProps) {
  const { isGlass } = useTheme();

  const sizeStyles: Record<Size, string> = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-sm',
    lg: 'h-12 px-5 text-base'
  };

  const materialVariant: Record<Variant, string> = {
    primary: 'bg-brand-700 text-white hover:bg-brand-600',
    secondary: 'border border-brand-700 bg-white text-brand-700 hover:bg-green-50',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
    destructive: 'bg-red-600 text-white hover:bg-red-500'
  };

  const glassVariant: Record<Variant, string> = {
    primary: 'bg-brand-700/80 text-white backdrop-blur-sm hover:bg-brand-700',
    secondary: 'border border-white/40 bg-white/30 text-green-800 backdrop-blur-md hover:bg-white/50',
    ghost: 'bg-transparent text-gray-700 hover:bg-white/40',
    destructive: 'border border-red-200 bg-red-500/80 text-white backdrop-blur-sm hover:bg-red-600'
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60',
        sizeStyles[size],
        isGlass ? 'rounded-2xl' : 'rounded-xl',
        isGlass ? glassVariant[variant] : materialVariant[variant],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
