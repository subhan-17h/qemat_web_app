'use client';

import { Heart, Share2, Store, Trophy } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { AppBar } from '@/components/navigation/AppBar';
import { DesktopSectionHeader } from '@/components/navigation/DesktopSectionHeader';
import { BottomSheet } from '@/components/shared/BottomSheet';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { EmptyState } from '@/components/shared/EmptyState';
import { SafeImage } from '@/components/shared/SafeImage';
import { formatPKR, googleMapsQuery } from '@/lib/formatters';
import { fetchProductWithMatches } from '@/lib/api';
import { useAppStore } from '@/store/app-store';
import { Product } from '@/types/product';

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams<{ productId: string }>();
  const { isFavorited, isFavoriteSyncing, toggleFavorite } = useAppStore();

  const [promptSignIn, setPromptSignIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [matches, setMatches] = useState<Product[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetchProductWithMatches(params.productId);
        if (active) {
          setProduct(response.product);
          setMatches([response.product, ...response.matches]);
        }
      } catch (error) {
        console.error('Failed to load product.', error);
        if (active) {
          setProduct(null);
          setMatches([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [params.productId]);

  const cheapest = useMemo(() => {
    if (!matches.length) return null;
    return matches.reduce((lowest, current) => (current.price < lowest.price ? current : lowest), matches[0]);
  }, [matches]);

  const comparisonRows = useMemo(() => {
    if (!product) return [];
    return matches.filter((item) => item.productId !== product.productId);
  }, [matches, product]);

  if (!loading && !product) {
    return (
      <div className="mx-auto w-full max-w-screen-2xl px-4 lg:px-10 xl:px-12">
        <AppBar title="Product Details" showBack sticky />
        <DesktopSectionHeader title="Product Details" showBack />
        <EmptyState
          icon={<Heart className="text-gray-300" size={48} />}
          title="Product not found"
          description="This product may have been removed."
        />
      </div>
    );
  }

  const handleToggleFavorite = async () => {
    if (!product) return;
    try {
      await toggleFavorite(product.productId, product);
    } catch {
      setPromptSignIn(true);
    }
  };

  const handleShare = async () => {
    if (!product) return;
    const payload = {
      title: product.name,
      text: `${product.name} is available at ${formatPKR(product.price)} at ${product.storeId}`,
      url: window.location.href
    };

    if (navigator.share) {
      await navigator.share(payload);
      return;
    }

    await navigator.clipboard.writeText(`${payload.title}\n${payload.text}\n${payload.url}`);
    alert('Product details copied to clipboard.');
  };

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 pb-8 lg:px-10 xl:px-12">
      <AppBar
        title="Product Details"
        showBack
        sticky
        rightAction={
          <div className="flex items-center gap-1">
            <button aria-label="Share product" onClick={handleShare} className="rounded-full p-2 text-gray-700 hover:bg-gray-100">
              <Share2 size={18} />
            </button>
            <button
              aria-label="Favorite product"
              onClick={handleToggleFavorite}
              className={`rounded-full p-2 text-gray-700 hover:bg-gray-100 ${product && isFavoriteSyncing(product.productId) ? 'favorite-sync-pulse' : ''}`}
            >
              <Heart
                size={20}
                className={product && isFavorited(product.productId) ? 'fill-red-600 text-red-600' : ''}
              />
            </button>
          </div>
        }
      />
      <DesktopSectionHeader
        title="Product Details"
        subtitle={product?.storeId}
        showBack
        rightAction={
          <div className="flex items-center gap-1">
            <button
              aria-label="Share product"
              onClick={handleShare}
              className="rounded-full border border-gray-200 bg-white p-2 text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Share2 size={17} />
            </button>
            <button
              aria-label="Favorite product"
              onClick={handleToggleFavorite}
              className={`rounded-full border border-gray-200 bg-white p-2 text-gray-700 transition-colors hover:bg-gray-50 ${product && isFavoriteSyncing(product.productId) ? 'favorite-sync-pulse' : ''}`}
            >
              <Heart
                size={18}
                className={product && isFavorited(product.productId) ? 'fill-red-600 text-red-600' : ''}
              />
            </button>
          </div>
        }
      />

      {loading || !product ? (
        <>
          <Card className="mt-3 rounded-[1.75rem] p-3.5">
            <div className="mb-3 flex items-center justify-center gap-2">
              <div className="details-modern-shimmer h-10 w-28 rounded-full" />
              <div className="details-modern-shimmer h-9 w-36 rounded-full" />
            </div>
            <div className="details-modern-shimmer relative mx-auto h-52 w-full max-w-[200px] rounded-2xl" />
            <div className="mt-3 space-y-2 px-1">
              <div className="details-modern-shimmer mx-auto h-6 w-10/12 rounded-lg" />
              <div className="details-modern-shimmer mx-auto h-6 w-32 rounded-lg" />
            </div>
          </Card>

          <Card className="mt-4 border border-green-100 bg-green-50 p-2.5">
            <div className="mb-2 flex items-center gap-2">
              <div className="details-modern-shimmer h-7 w-7 rounded-full" />
              <div className="details-modern-shimmer h-6 w-24 rounded-lg" />
            </div>
            <div className="rounded-2xl bg-white p-2.5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-2">
                  <div className="details-modern-shimmer h-5 w-24 rounded-md" />
                  <div className="details-modern-shimmer h-5 w-20 rounded-md" />
                </div>
                <div className="details-modern-shimmer h-8 w-32 rounded-full" />
              </div>
            </div>
          </Card>

          <section className="mt-5">
            <div className="details-modern-shimmer mb-3 h-7 w-36 rounded-lg" />
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={`details-shimmer-${index}`} className="p-0 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.45)]">
                  <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5">
                    <div className="details-modern-shimmer h-12 w-12 rounded-lg" />
                    <span className="flex-1 space-y-1.5">
                      <span className="details-modern-shimmer block h-4 w-11/12 rounded-md" />
                      <span className="details-modern-shimmer block h-3 w-24 rounded-md" />
                    </span>
                    <span className="space-y-1.5">
                      <span className="details-modern-shimmer block h-4 w-16 rounded-md" />
                      <span className="details-modern-shimmer block h-4 w-14 rounded-full" />
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <div className="mt-6">
            <div className="details-modern-shimmer h-11 w-full rounded-full" />
          </div>
        </>
      ) : (
        <>
          <Card className="mt-3 rounded-[1.75rem] p-3.5">
            <div className="mb-3 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-700">
                <Store size={15} />
                {product.storeId}
              </span>
              <Button size="sm" className="h-9 rounded-full px-4" onClick={() => window.open(googleMapsQuery(product.storeId), '_blank')}>
                Find Store on Map
              </Button>
            </div>

            <div className="relative mx-auto h-52 w-full max-w-[200px] bg-white">
              <SafeImage
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-contain"
                fallbackClassName="bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100"
                iconClassName="h-8 w-8 text-slate-400"
              />
            </div>
            <div className="mt-3 space-y-1 px-1">
              <h2 className="text-center text-lg font-bold text-gray-900">{product.name}</h2>
              <p className="text-center text-lg font-medium text-gray-900">{formatPKR(product.price)}</p>
            </div>
          </Card>

          {cheapest ? (
            <Card className="mt-4 border border-green-100 bg-green-50 p-2.5">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-green-100 text-brand-700">
                  <Trophy size={14} />
                </span>
                <p className="text-base font-semibold text-gray-900">Best Price</p>
              </div>

              <div className="rounded-2xl bg-white p-2.5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold leading-none text-gray-900">{cheapest.storeId}</p>
                    <p className="text-lg font-extrabold leading-none text-brand-700">{formatPKR(cheapest.price)}</p>
                  </div>
                  <Button
                    size="sm"
                    className="h-8 shrink-0 self-center rounded-full px-3.5 text-xs"
                    onClick={() => window.open(googleMapsQuery(cheapest.storeId), '_blank')}
                  >
                    Find Store on Map
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}

          {comparisonRows.length ? (
            <section className="mt-5">
              <h3 className="mb-3 text-lg font-bold text-gray-900">Compare Prices</h3>
              <div className="space-y-2.5">
                {matches.map((item) => (
                  <Card key={item.productId} className="p-0 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.45)]">
                    <button
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left hover:bg-gray-50"
                      onClick={() => window.open(googleMapsQuery(item.storeId), '_blank')}
                    >
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-white">
                        <SafeImage
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-contain"
                          fallbackClassName="bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100"
                          iconClassName="h-5 w-5 text-slate-400"
                        />
                      </div>
                      <span className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.storeId}</p>
                      </span>
                      <span className="text-right">
                        <p className="text-base font-bold text-gray-900">{formatPKR(item.price)}</p>
                        {cheapest && item.productId === cheapest.productId ? (
                          <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-brand-700">Best ✓</span>
                        ) : null}
                      </span>
                    </button>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          <div className="mt-6">
            <Button variant="secondary" fullWidth className="rounded-full" onClick={() => router.push(`/add-price?productId=${product.productId}`)}>
              Report Price Issue
            </Button>
          </div>
        </>
      )}

      <BottomSheet
        open={promptSignIn}
        onClose={() => setPromptSignIn(false)}
        title="Sign In Required"
        description="Please sign in to add products to your favorites."
        confirmLabel="Sign In"
        onConfirm={() => router.push('/sign-in')}
      />

      <style jsx global>{`
        .details-modern-shimmer {
          position: relative;
          overflow: hidden;
          background: linear-gradient(110deg, #f3f4f6 10%, #ffffff 40%, #e5e7eb 60%, #f3f4f6 90%);
          background-size: 220% 100%;
          animation: details-modern-shimmer 1.4s linear infinite;
        }

        @keyframes details-modern-shimmer {
          0% {
            background-position: 120% 0;
          }
          100% {
            background-position: -120% 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .details-modern-shimmer {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
