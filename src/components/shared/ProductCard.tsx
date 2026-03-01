'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';

import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { formatPKR } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Product } from '@/types/product';

export function ProductCard({
  product,
  compact,
  showFavorite,
  favorited,
  onFavoriteToggle,
  className
}: {
  product: Product;
  compact?: boolean;
  showFavorite?: boolean;
  favorited?: boolean;
  onFavoriteToggle?: () => void;
  className?: string;
}) {
  return (
    <Card className={cn('overflow-hidden p-0', className)}>
      <div className={cn('relative w-full', compact ? 'h-24' : 'h-32')}>
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          loading="lazy"
          className={cn(compact ? 'object-cover' : 'object-cover')}
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
      </div>
    </Card>
  );
}
