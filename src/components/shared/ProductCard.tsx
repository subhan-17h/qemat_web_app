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
      <div className="relative h-32 w-full">
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
      <div className="space-y-2 p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold text-gray-900 md:text-base">{product.name}</h3>
        <p className="text-lg font-bold text-brand-700">{formatPKR(product.price)}</p>
        <p className="text-xs text-gray-500">{product.matchedProductsCount}+ similar products</p>
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">{product.storeId}</span>
          {!compact ? (
            <Link href={`/product/${product.productId}`}>
              <Button size="sm" className="w-24">
                Compare
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
