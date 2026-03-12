'use client';

import { Heart, HeartOff, Lock } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';

import { AppBar } from '@/components/navigation/AppBar';
import { BottomSheet } from '@/components/shared/BottomSheet';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { EmptyState } from '@/components/shared/EmptyState';
import { SafeImage } from '@/components/shared/SafeImage';
import { fetchFavoriteProducts } from '@/lib/api';
import { isFavoritesProductsCacheFresh, patchFavoritesProductsCache, readFavoritesProductsCache, writeFavoritesProductsCache } from '@/lib/favorites-products-cache';
import { formatPKR } from '@/lib/formatters';
import { useAppStore } from '@/store/app-store';
import { Product } from '@/types/product';

function hasSameFavoriteIds(products: Product[], favoriteIds: string[]) {
  if (products.length !== favoriteIds.length) return false;
  const idSet = new Set(favoriteIds);
  return products.every((product) => idSet.has(product.productId));
}

function FavoritesShimmerRows({ count }: { count: number }) {
  return (
    <div className="mt-4 space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`favorite-shimmer-${index}`}
          className="overflow-hidden rounded-[1.4rem] border border-gray-200/70 bg-[#f8f8f8] p-3 shadow-[0_14px_24px_-24px_rgba(15,23,42,0.3)]"
        >
          <div className="flex items-center gap-2.5">
            <div className="favorites-modern-shimmer h-[56px] w-[82px] shrink-0 rounded-lg bg-white" />
            <div className="flex-1 space-y-1.5">
              <div className="favorites-modern-shimmer h-4 w-11/12 rounded-md" />
              <div className="favorites-modern-shimmer h-4 w-8/12 rounded-md" />
              <div className="favorites-modern-shimmer h-3.5 w-24 rounded-md" />
            </div>
            <div className="favorites-modern-shimmer h-8 w-8 rounded-full bg-white" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FavoritesPage() {
  const router = useRouter();
  const { user, favorites, favoritesLoaded, removeFavorite } = useAppStore();

  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const rowCardRefs = useRef(new Map<string, HTMLDivElement>());
  const visibleRowCards = useRef(new Set<HTMLDivElement>());
  const parallaxFrame = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user?.token) {
        setFavoriteProducts([]);
        setLoading(false);
        return;
      }

      const now = Date.now();
      const cachedForUser = readFavoritesProductsCache(user.token);
      const hasCacheForUser = Boolean(cachedForUser);
      const cachedProducts = cachedForUser?.products ?? [];

      // Always render cached rows immediately on remount to avoid shimmer between tab/page shifts.
      if (hasCacheForUser) {
        const projectedCachedProducts = favoritesLoaded
          ? cachedProducts.filter((item) => favorites.includes(item.productId))
          : cachedProducts;
        setFavoriteProducts(projectedCachedProducts);
      }

      // Avoid false "No favorites yet" before store favorite IDs are hydrated.
      if (cachedForUser && favoritesLoaded) {
        const projectedCachedProducts = cachedForUser.products.filter((item) => favorites.includes(item.productId));
        const cacheUsable =
          isFavoritesProductsCacheFresh(cachedForUser, now) &&
          hasSameFavoriteIds(projectedCachedProducts, favorites);

        if (cacheUsable) {
          setFavoriteProducts(projectedCachedProducts);
          setLoading(false);
          return;
        }
      }

      // Show shimmer only when there's no cached data to display.
      setLoading(!hasCacheForUser);
      try {
        const products = await fetchFavoriteProducts(user.token);
        if (active) {
          setFavoriteProducts(products);
          writeFavoritesProductsCache(user.token, products);
        }
      } catch (error) {
        console.error('Failed to load favorite products.', error);
        if (active) setFavoriteProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [favorites, favoritesLoaded, user]);

  const registerRowCard = useCallback(
    (productId: string) => (node: HTMLDivElement | null) => {
      const existingNode = rowCardRefs.current.get(productId);
      if (existingNode && existingNode !== node) {
        visibleRowCards.current.delete(existingNode);
      }

      if (node) {
        rowCardRefs.current.set(productId, node);
        return;
      }

      if (existingNode) {
        rowCardRefs.current.delete(productId);
        visibleRowCards.current.delete(existingNode);
      }
    },
    []
  );

  const queueParallaxUpdate = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (parallaxFrame.current !== null) return;

    parallaxFrame.current = window.requestAnimationFrame(() => {
      parallaxFrame.current = null;
      const viewportCenter = window.innerHeight * 0.5;

      visibleRowCards.current.forEach((row) => {
        const rect = row.getBoundingClientRect();
        if (rect.bottom < -40 || rect.top > window.innerHeight + 40) return;

        const center = rect.top + rect.height * 0.5;
        const ratio = Math.max(-1, Math.min(1, (center - viewportCenter) / viewportCenter));
        const shift = ratio * -12;
        const tilt = ratio * -1.8;
        const scale = 1 - Math.abs(ratio) * 0.02;

        row.style.setProperty('--row-parallax-y', `${shift.toFixed(2)}px`);
        row.style.setProperty('--row-parallax-tilt', `${tilt.toFixed(2)}deg`);
        row.style.setProperty('--row-parallax-scale', `${scale.toFixed(3)}`);
      });
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (loading || !favoriteProducts.length) return;

    const rows = Array.from(rowCardRefs.current.values());
    if (!rows.length) return;
    const visibleRows = visibleRowCards.current;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      rows.forEach((row) => {
        row.dataset.visible = 'true';
        row.style.removeProperty('--row-parallax-y');
        row.style.removeProperty('--row-parallax-tilt');
        row.style.removeProperty('--row-parallax-scale');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const row = entry.target as HTMLDivElement;
          if (entry.isIntersecting) {
            row.dataset.visible = 'true';
            visibleRows.add(row);
          } else {
            visibleRows.delete(row);
            row.style.setProperty('--row-parallax-y', '0px');
            row.style.setProperty('--row-parallax-tilt', '0deg');
            row.style.setProperty('--row-parallax-scale', '1');
          }
        });
        queueParallaxUpdate();
      },
      { rootMargin: '220px 0px', threshold: [0, 0.2, 0.5] }
    );

    rows.forEach((row) => observer.observe(row));
    queueParallaxUpdate();
    window.addEventListener('scroll', queueParallaxUpdate, { passive: true });
    window.addEventListener('resize', queueParallaxUpdate);

    return () => {
      observer.disconnect();
      visibleRows.clear();
      window.removeEventListener('scroll', queueParallaxUpdate);
      window.removeEventListener('resize', queueParallaxUpdate);
      if (parallaxFrame.current !== null) {
        window.cancelAnimationFrame(parallaxFrame.current);
        parallaxFrame.current = null;
      }
    };
  }, [loading, favoriteProducts.length, queueParallaxUpdate]);

  const handleRemove = async () => {
    if (!removeTarget) return;
    await removeFavorite(removeTarget);
    setFavoriteProducts((current) => {
      const next = current.filter((item) => item.productId !== removeTarget);
      if (user?.token) {
        patchFavoritesProductsCache(user.token, () => next);
      }
      return next;
    });
    setRemoveTarget(null);
  };

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 pb-8 lg:px-10 xl:px-12">
      <AppBar title="Favorites" sticky />

      {!user ? (
        <EmptyState
          icon={<Lock className="text-gray-300" size={48} />}
          title="Sign in to see your favorites"
          description="Create a free account to save and track your favourite products"
          action={<Button onClick={() => router.push('/sign-in')}>Sign In</Button>}
        />
      ) : loading ? (
        <FavoritesShimmerRows count={5} />
      ) : favoriteProducts.length === 0 ? (
        <EmptyState
          icon={<HeartOff className="text-gray-300" size={48} />}
          title="No favorites yet"
          description="Browse products and tap the heart icon to save them here"
          action={<Button onClick={() => router.push('/search')}>Browse Products</Button>}
        />
      ) : (
        <div className="mt-4 space-y-3">
          {favoriteProducts.map((product, index) => (
            <div
              key={product.productId}
              ref={registerRowCard(product.productId)}
              data-visible="false"
              className="favorite-row-card"
              style={{ '--row-enter-delay': `${Math.min(index, 10) * 44}ms` } as CSSProperties}
            >
              <div className="favorite-row-card-inner">
                <Card className="group relative rounded-[1.4rem] border-gray-200/70 bg-[#f8f8f8] p-3 shadow-[0_14px_24px_-24px_rgba(15,23,42,0.3)] transition-all">
                  <button
                    aria-label="Remove from favorites"
                    onClick={() => setRemoveTarget(product.productId)}
                    className="absolute right-2.5 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white text-red-500 shadow-sm transition-all hover:scale-105 hover:text-red-600"
                  >
                    <Heart size={17} className="fill-current" />
                  </button>

                  <button
                    onClick={() => router.push(`/product/${product.productId}`)}
                    className="flex w-full items-center gap-2.5 pr-10 text-left"
                  >
                    <div className="relative h-[56px] w-[82px] shrink-0 overflow-hidden rounded-lg bg-white">
                      <SafeImage
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-contain p-1"
                        fallbackClassName="bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100"
                        iconClassName="h-4 w-4 text-slate-400"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-[16px] font-semibold leading-snug text-gray-900">{product.name}</h3>
                      <p className="mt-0.5 text-[15px] font-bold leading-tight text-green-600">{formatPKR(product.price)}</p>
                      <p className="mt-0.5 text-[13px] font-medium text-gray-500">{product.storeId}</p>
                    </div>
                  </button>
                </Card>
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomSheet
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        title="Remove from Favorites"
        description="Are you sure you want to remove this product from your favorites?"
        confirmLabel="Remove"
        onConfirm={handleRemove}
        destructive
      />

      <style jsx global>{`
        .favorites-modern-shimmer {
          position: relative;
          overflow: hidden;
          background: linear-gradient(110deg, #f3f4f6 10%, #ffffff 40%, #e5e7eb 60%, #f3f4f6 90%);
          background-size: 220% 100%;
          animation: favorites-modern-shimmer 1.4s linear infinite;
        }

        .favorite-row-card {
          opacity: 0;
          transform: translate3d(0, 18px, 0);
          filter: saturate(0.9);
          transition:
            opacity 520ms cubic-bezier(0.22, 1, 0.36, 1),
            transform 600ms cubic-bezier(0.22, 1, 0.36, 1),
            filter 520ms ease;
          transition-delay: var(--row-enter-delay, 0ms);
        }

        .favorite-row-card[data-visible='true'] {
          opacity: 1;
          transform: translate3d(0, 0, 0);
          filter: saturate(1);
        }

        .favorite-row-card-inner {
          will-change: transform;
          transform: translate3d(0, var(--row-parallax-y, 0px), 0) rotateX(var(--row-parallax-tilt, 0deg))
            scale(var(--row-parallax-scale, 1));
          transform-origin: center center;
          transition: transform 180ms cubic-bezier(0.2, 0.88, 0.32, 1);
        }

        @keyframes favorites-modern-shimmer {
          0% {
            background-position: 120% 0;
          }
          100% {
            background-position: -120% 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .favorites-modern-shimmer {
            animation: none;
          }

          .favorite-row-card,
          .favorite-row-card[data-visible='true'] {
            opacity: 1;
            transform: none;
            filter: none;
            transition: none;
          }

          .favorite-row-card-inner {
            transition: none;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
