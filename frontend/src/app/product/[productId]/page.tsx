'use client';

import { Heart, Share2, Store, Trophy } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { MouseEvent as ReactMouseEvent, useEffect, useMemo, useState } from 'react';

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

  const handleOpenComparedProduct = (event: ReactMouseEvent<HTMLButtonElement>, productId: string) => {
    if (!productId) return;

    const href = `/product/${encodeURIComponent(productId)}`;
    const docWithTransition = document as Document & {
      startViewTransition?: (callback: () => void) => { finished: Promise<void> };
    };

    if (!docWithTransition.startViewTransition) {
      router.push(href);
      return;
    }

    event.preventDefault();
    const root = document.documentElement;
    const rect = event.currentTarget.getBoundingClientRect();
    const originX = `${((rect.left + rect.width / 2) / window.innerWidth) * 100}%`;
    const originY = `${((rect.top + rect.height / 2) / window.innerHeight) * 100}%`;
    const navIntent = window.innerWidth >= 1024 ? 'desktop-deep-open' : 'browse-open';

    root.setAttribute('data-nav-intent', navIntent);
    root.style.setProperty('--vt-origin-x', originX);
    root.style.setProperty('--vt-origin-y', originY);

    const transition = docWithTransition.startViewTransition(() => {
      router.push(href);
    });

    transition.finished.finally(() => {
      root.removeAttribute('data-nav-intent');
      root.style.removeProperty('--vt-origin-x');
      root.style.removeProperty('--vt-origin-y');
    });
  };

  return (
    <div className="relative mx-auto w-full max-w-screen-2xl px-4 pb-8 lg:px-10 xl:px-12">
      <div className="pointer-events-none absolute inset-x-8 top-20 -z-10 hidden h-[320px] rounded-[2.25rem] bg-[radial-gradient(80%_65%_at_16%_20%,rgba(16,185,129,0.14),transparent_58%),radial-gradient(72%_62%_at_84%_24%,rgba(59,130,246,0.12),transparent_60%),linear-gradient(180deg,rgba(248,250,252,0.8)_0%,rgba(241,245,249,0.55)_100%)] blur-2xl lg:block" />
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
        <div className="mt-3 space-y-5 lg:mt-4 lg:space-y-5">
          <div className="lg:grid lg:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)] lg:items-stretch lg:gap-4 xl:gap-5">
            <Card className="rounded-[1.75rem] p-3.5 lg:rounded-[2rem] lg:border-white/70 lg:bg-white/88 lg:p-6 lg:shadow-[0_30px_60px_-44px_rgba(15,23,42,0.62)] lg:backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-center gap-2 lg:mb-5 lg:justify-start">
                <div className="details-modern-shimmer h-10 w-28 rounded-full" />
                <div className="details-modern-shimmer h-9 w-36 rounded-full" />
              </div>
              <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center lg:gap-6">
                <div className="details-modern-shimmer relative mx-auto h-52 w-full max-w-[200px] rounded-2xl lg:h-64 lg:max-w-none lg:rounded-[1.35rem]" />
                <div className="mt-3 space-y-2 px-1 lg:mt-0 lg:px-0">
                  <div className="details-modern-shimmer mx-auto h-8 w-10/12 rounded-lg lg:mx-0 lg:h-9 lg:w-11/12" />
                  <div className="details-modern-shimmer mx-auto h-7 w-40 rounded-lg lg:mx-0 lg:h-8 lg:w-44" />
                  <div className="details-modern-shimmer mx-auto hidden h-5 w-56 rounded-lg lg:block lg:mx-0" />
                  <div className="details-modern-shimmer mx-auto hidden h-5 w-48 rounded-lg lg:block lg:mx-0" />
                </div>
              </div>
            </Card>

            <div
              className={`mt-4 space-y-4 lg:mt-0 lg:grid lg:gap-4 lg:space-y-0 ${
                cheapest ? 'lg:h-full lg:grid-rows-2' : 'lg:auto-rows-fr'
              }`}
            >
              <Card className="border border-green-100 bg-green-50 p-2.5 lg:h-full lg:rounded-[1.6rem] lg:border-emerald-200/60 lg:bg-gradient-to-br lg:from-emerald-50/92 lg:via-white lg:to-emerald-50/75 lg:p-[18px] lg:shadow-[0_28px_48px_-36px_rgba(16,185,129,0.6)]">
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

              <Card className="hidden border border-slate-200/75 bg-gradient-to-br from-white via-slate-50 to-white p-4 lg:flex lg:h-full lg:flex-col lg:justify-between">
                <div className="space-y-2">
                  <div className="details-modern-shimmer h-5 w-36 rounded-md" />
                  <div className="details-modern-shimmer h-4 w-52 rounded-md" />
                </div>
                <div className="mt-3 details-modern-shimmer h-10 w-full rounded-full" />
              </Card>
            </div>
          </div>

          <section>
            <div className="details-modern-shimmer mb-3 h-7 w-36 rounded-lg" />
            <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 lg:gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={`details-shimmer-${index}`} className="p-0 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.45)]">
                  <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5 lg:px-4 lg:py-3">
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

          <div className="mt-6 lg:hidden">
            <div className="details-modern-shimmer h-11 w-full rounded-full" />
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-5 lg:mt-4 lg:space-y-6">
          <div className="lg:grid lg:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)] lg:items-stretch lg:gap-4 xl:gap-5">
            <Card className="rounded-[1.75rem] p-3.5 lg:rounded-[2rem] lg:border-white/70 lg:bg-white/88 lg:p-6 lg:shadow-[0_30px_60px_-44px_rgba(15,23,42,0.62)] lg:backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-center gap-2 lg:mb-5 lg:justify-start">
                <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-700">
                  <Store size={15} />
                  {product.storeId}
                </span>
                <Button size="sm" className="h-9 rounded-full px-4" onClick={() => window.open(googleMapsQuery(product.storeId), '_blank')}>
                  Find Store on Map
                </Button>
              </div>

              <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center lg:gap-6">
                <div className="relative mx-auto h-52 w-full max-w-[200px] bg-white lg:h-64 lg:max-w-none lg:rounded-[1.35rem] lg:border lg:border-gray-200/70 lg:bg-gradient-to-br lg:from-white lg:to-slate-50/95">
                  <SafeImage
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-contain"
                    fallbackClassName="bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100"
                    iconClassName="h-8 w-8 text-slate-400"
                  />
                </div>
                <div className="mt-3 space-y-1 px-1 lg:mt-0 lg:space-y-2 lg:px-0">
                  <h2 className="text-center text-lg font-bold text-gray-900 lg:text-left lg:text-[1.6rem] lg:leading-snug">{product.name}</h2>
                  <p className="text-center text-lg font-medium text-gray-900 lg:text-left lg:text-[1.8rem] lg:font-extrabold lg:text-brand-700">
                    {formatPKR(product.price)}
                  </p>
                  <p className="hidden text-sm leading-relaxed text-gray-500 lg:block">
                    Compare this item across stores and pick the best deal before you checkout.
                  </p>
                  <div className="hidden items-center gap-2 pt-1 lg:flex">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {matches.length} stores tracked
                    </span>
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                      {product.matchedProductsCount}+ similar matches
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <div className="mt-4 space-y-4 lg:mt-0 lg:grid lg:h-full lg:grid-rows-2 lg:gap-4 lg:space-y-0">
              {cheapest ? (
                <Card className="border border-green-100 bg-green-50 p-2.5 lg:h-full lg:rounded-[1.6rem] lg:border-emerald-200/60 lg:bg-gradient-to-br lg:from-emerald-50/92 lg:via-white lg:to-emerald-50/75 lg:p-[18px] lg:shadow-[0_28px_48px_-36px_rgba(16,185,129,0.6)]">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-green-100 text-brand-700">
                      <Trophy size={14} />
                    </span>
                    <p className="text-base font-semibold text-gray-900">Best Price</p>
                  </div>

                  <div className="rounded-2xl bg-white p-2.5 shadow-sm lg:p-3">
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

              <Card className="hidden border border-slate-200/75 bg-gradient-to-br from-white via-slate-50 to-white p-4 lg:flex lg:h-full lg:flex-col lg:justify-between">
                <div className="space-y-1">
                  <p className="text-base font-semibold text-gray-900">Notice an outdated price?</p>
                  <p className="text-sm text-gray-600">Help us keep comparisons accurate by reporting pricing issues.</p>
                </div>
                <Button
                  variant="secondary"
                  fullWidth
                  className="mt-3 rounded-full"
                  onClick={() => router.push(`/add-price?productId=${product.productId}`)}
                >
                  Report Price Issue
                </Button>
              </Card>
            </div>
          </div>

          {comparisonRows.length ? (
            <section>
              <h3 className="mb-3 text-lg font-bold text-gray-900">Compare Prices</h3>
              <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 lg:gap-3">
                {comparisonRows.map((item, index) => (
                  <Card
                    key={item.productId || `${item.storeId}-${index}`}
                    className="p-0 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.45)] lg:rounded-[1.2rem] lg:border-gray-200/75 lg:bg-white/88 lg:shadow-[0_20px_32px_-26px_rgba(15,23,42,0.5)] lg:backdrop-blur-sm"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50 lg:px-4 lg:py-3"
                      onClick={(event) => handleOpenComparedProduct(event, item.productId)}
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
                        <p className="text-sm font-semibold text-gray-900 lg:text-[15px]">{item.name}</p>
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

          <div className="mt-6 lg:hidden">
            <Button variant="secondary" fullWidth className="rounded-full" onClick={() => router.push(`/add-price?productId=${product.productId}`)}>
              Report Price Issue
            </Button>
          </div>
        </div>
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
