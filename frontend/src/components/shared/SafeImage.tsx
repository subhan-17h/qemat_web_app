'use client';

import type { ComponentProps } from 'react';
import { ImageOff } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

type NextImageProps = ComponentProps<typeof Image>;

type SafeImageProps = Omit<NextImageProps, 'src' | 'alt'> & {
  src?: string | null;
  alt: string;
  fallbackLabel?: string;
  fallbackClassName?: string;
  iconClassName?: string;
};

export function SafeImage({
  src,
  alt,
  fallbackLabel,
  fallbackClassName,
  iconClassName,
  fill,
  onError,
  unoptimized,
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const normalizedSrc = src?.trim() ?? '';
  const hasSource = normalizedSrc.length > 0;
  const showFallback = !hasSource || hasError;

  useEffect(() => {
    setHasError(false);
  }, [normalizedSrc]);

  const renderFallback = () => (
    <div
      role="img"
      aria-label={fallbackLabel ?? `${alt} image unavailable`}
      className={cn(
        'grid place-items-center bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 text-slate-400',
        fill ? 'absolute inset-0' : 'h-full w-full',
        fallbackClassName
      )}
    >
      <ImageOff className={cn('h-7 w-7', iconClassName)} strokeWidth={1.8} />
    </div>
  );

  if (showFallback) {
    return renderFallback();
  }

  return (
    <Image
      {...props}
      src={normalizedSrc}
      alt={alt}
      fill={fill}
      unoptimized={typeof unoptimized === 'boolean' ? unoptimized : normalizedSrc.startsWith('http')}
      onError={(event) => {
        setHasError(true);
        onError?.(event);
      }}
    />
  );
}
