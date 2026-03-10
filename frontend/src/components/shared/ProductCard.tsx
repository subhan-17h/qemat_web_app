'use client';

import Link from 'next/link';
import { BadgeCheck, Heart } from 'lucide-react';

import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { SafeImage } from '@/components/shared/SafeImage';
import { formatPKR } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Product } from '@/types/product';

export function ProductCard({
  product,
  compact,
  searchCompact,
  homePopular,
  showFavorite,
  favorited,
  onFavoriteToggle,
  className
}: {
  product: Product;
  compact?: boolean;
  searchCompact?: boolean;
  homePopular?: boolean;
  showFavorite?: boolean;
  favorited?: boolean;
  onFavoriteToggle?: () => void;
  className?: string;
}) {
  if (searchCompact) {
    return (
      <Card
        className={cn(
          'h-[218px] overflow-hidden rounded-[1.3rem] border-gray-200/70 p-0 shadow-[0_9px_14px_-11px_rgba(15,23,42,0.40)]',
          className
        )}
      >
        <div className="relative h-28 w-full">
          <SafeImage
            src={product.imageUrl}
            alt={product.name}
            fill
            loading="lazy"
            className="object-contain"
            fallbackClassName="bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100"
            iconClassName="h-6 w-6 text-slate-400"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          {showFavorite ? (
            <button
              aria-label="Toggle favorite"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onFavoriteToggle?.();
              }}
              className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm"
            >
              <Heart size={16} className={favorited ? 'fill-current text-red-600' : ''} />
            </button>
          ) : null}
        </div>
        <div className="space-y-1 p-2.5">
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-gray-900">{product.name}</h3>
          <p className="flex items-center gap-1 text-[15px] font-bold leading-none text-brand-700">
            {formatPKR(product.price)}
            <BadgeCheck size={14} className="text-green-600" />
          </p>
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="text-[13px] font-medium text-gray-600">{product.storeId}</span>
            <span className="rounded-full border border-sky-200 bg-sky-100 px-1.5 py-1 text-[10px] font-bold leading-none text-sky-700">
              {product.matchedProductsCount}+ similar
            </span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden p-0', className)}>
      <div className={cn('relative w-full', compact ? 'h-24' : 'h-32')}>
        <SafeImage
          src={product.imageUrl}
          alt={product.name}
          fill
          loading="lazy"
          className={cn(homePopular ? 'object-contain' : compact ? 'object-cover' : 'object-cover')}
          fallbackClassName="bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100"
          iconClassName="h-6 w-6 text-slate-400"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {showFavorite ? (
          <button
            aria-label="Toggle favorite"
            onClick={onFavoriteToggle}
            className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-red-600"
          >
            <Heart size={16} className={favorited ? 'fill-current' : ''} />
          </button>
        ) : null}
      </div>
      <div className={cn('space-y-2', compact ? 'p-2.5' : 'p-3')}>
        <h3 className={cn('line-clamp-2 font-semibold text-gray-900', compact ? 'min-h-0 text-sm' : 'min-h-10 text-sm md:text-base')}>
          {product.name}
        </h3>
        <p className={cn('font-bold text-brand-700', compact ? 'text-base' : 'text-lg')}>{formatPKR(product.price)}</p>
        <p className={cn('text-gray-500', compact ? 'text-[11px]' : 'text-xs')}>{product.matchedProductsCount}+ similar products</p>
        {homePopular ? (
          <Link href={`/product/${product.productId}`} className="block">
            <Button size="sm" className={cn('w-full', compact ? 'h-9 text-sm' : '')}>
              Compare
            </Button>
          </Link>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className={cn('rounded-full bg-gray-100 font-medium text-gray-600', compact ? 'px-2 py-0.5 text-[10px]' : 'px-2 py-1 text-xs')}>
              {product.storeId}
            </span>
            <Link href={`/product/${product.productId}`}>
              <Button size={compact ? 'sm' : 'sm'} className={cn(compact ? 'h-8 w-20 text-xs' : 'w-24')}>
                Compare
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
}
