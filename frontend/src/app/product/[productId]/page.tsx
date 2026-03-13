'use client';

import { Bell, Clock3, Heart, Home, MapPin, Search, Settings, Share2, Store, Trophy, UserCircle2 } from 'lucide-react';
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

const desktopSidebarItems = [
  { key: 'home', label: 'Home', icon: Home, href: '/', active: false },
  { key: 'favorites', label: 'Favorites', icon: Heart, href: '/favorites', active: false },
  { key: 'alerts', label: 'Alerts', icon: Bell, href: '/search?browse=true', active: false },
  { key: 'history', label: 'Price History', icon: Clock3, href: null, active: true }
] as const;

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams<{ productId: string }>();
  const { user, isFavorited, isFavoriteSyncing, toggleFavorite } = useAppStore();

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

  const desktopComparisonRows = useMemo(() => {
    if (!product) return [];
    return comparisonRows.length ? comparisonRows : [product];
  }, [comparisonRows, product]);

  const bestStore = cheapest ?? product;
  const userDisplayName = user?.name?.trim() || (user?.email ? user.email.split('@')[0] : 'Guest User');

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
        <>
          <div className="mt-3 space-y-5 lg:hidden">
            <Card className="rounded-[1.75rem] p-3.5">
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

            <Card className="border border-green-100 bg-green-50 p-2.5">
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

            <section>
              <div className="details-modern-shimmer mb-3 h-7 w-36 rounded-lg" />
              <div className="space-y-2.5">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card key={`details-shimmer-mobile-${index}`} className="p-0 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.45)]">
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
          </div>

          <div className="product-desktop-shell hidden lg:block lg:mt-4">
            <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)_300px] xl:grid-cols-[240px_minmax(0,1fr)_340px]">
              <aside className="product-desktop-panel p-4">
                <div className="details-modern-shimmer h-16 w-16 rounded-2xl" />
                <div className="mt-6 space-y-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={`sidebar-nav-shimmer-${index}`} className="details-modern-shimmer h-11 w-full rounded-2xl" />
                  ))}
                </div>
                <div className="mt-10 details-modern-shimmer h-24 w-full rounded-2xl" />
              </aside>

              <section className="space-y-5">
                <div className="product-desktop-panel flex items-center gap-3 px-4 py-3">
                  <div className="details-modern-shimmer h-5 w-5 rounded-full" />
                  <div className="details-modern-shimmer h-6 w-64 rounded-xl" />
                </div>

                <Card className="product-desktop-panel p-5">
                  <div className="grid grid-cols-[220px_minmax(0,1fr)] gap-6">
                    <div className="details-modern-shimmer h-64 rounded-3xl" />
                    <div className="space-y-3 pt-2">
                      <div className="details-modern-shimmer h-9 w-11/12 rounded-xl" />
                      <div className="details-modern-shimmer h-8 w-36 rounded-xl" />
                      <div className="details-modern-shimmer h-5 w-full rounded-lg" />
                      <div className="details-modern-shimmer h-5 w-10/12 rounded-lg" />
                      <div className="flex gap-2 pt-1">
                        <div className="details-modern-shimmer h-8 w-28 rounded-full" />
                        <div className="details-modern-shimmer h-8 w-32 rounded-full" />
                      </div>
                    </div>
                  </div>
                </Card>

                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="details-modern-shimmer h-7 w-44 rounded-lg" />
                    <div className="details-modern-shimmer h-10 w-36 rounded-full" />
                  </div>
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={`desktop-row-shimmer-${index}`} className="product-desktop-panel flex items-center gap-3 p-3">
                        <div className="details-modern-shimmer h-12 w-12 rounded-xl" />
                        <div className="flex-1 space-y-1.5">
                          <div className="details-modern-shimmer h-5 w-4/5 rounded-lg" />
                          <div className="details-modern-shimmer h-4 w-20 rounded-lg" />
                        </div>
                        <div className="details-modern-shimmer h-6 w-20 rounded-lg" />
                      </div>
                    ))}
                  </div>
                </section>
              </section>

              <aside className="space-y-5">
                <Card className="product-desktop-panel p-4">
                  <div className="details-modern-shimmer h-7 w-28 rounded-lg" />
                  <div className="mt-3 rounded-3xl border border-white/60 bg-white/72 p-3">
                    <div className="details-modern-shimmer h-6 w-24 rounded-lg" />
                    <div className="details-modern-shimmer mt-2 h-7 w-20 rounded-lg" />
                    <div className="details-modern-shimmer mt-3 h-10 w-full rounded-full" />
                  </div>
                </Card>

                <Card className="product-desktop-panel p-4">
                  <div className="details-modern-shimmer h-6 w-44 rounded-lg" />
                  <div className="details-modern-shimmer mt-2 h-5 w-11/12 rounded-lg" />
                  <div className="details-modern-shimmer mt-1 h-5 w-10/12 rounded-lg" />
                  <div className="details-modern-shimmer mt-4 h-10 w-full rounded-full" />
                </Card>
              </aside>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mt-3 space-y-5 lg:hidden">
            <Card className="rounded-[1.75rem] p-3.5">
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
              <Card className="border border-green-100 bg-green-50 p-2.5">
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
              <section>
                <h3 className="mb-3 text-lg font-bold text-gray-900">Compare Prices</h3>
                <div className="space-y-2.5">
                  {comparisonRows.map((item, index) => (
                    <Card key={item.productId || `${item.storeId}-${index}`} className="p-0 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.45)]">
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
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
          </div>

          <div className="product-desktop-shell hidden lg:block lg:mt-4">
            <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)_300px] xl:grid-cols-[240px_minmax(0,1fr)_340px]">
              <aside className="product-desktop-panel product-desktop-sidebar sticky top-4 self-start p-4">
                <div className="product-sidebar-logo mx-auto grid h-16 w-16 place-items-center rounded-2xl">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-black text-white">
                    <Store size={18} />
                  </span>
                </div>

                <nav className="mt-6 space-y-1.5">
                  {desktopSidebarItems.map((item) => {
                    const Icon = item.icon;
                    const active = Boolean(item.active);
                    return (
                      <button
                        key={item.key}
                        type="button"
                        disabled={!item.href}
                        onClick={() => {
                          if (item.href) router.push(item.href);
                        }}
                        className={`product-sidebar-link ${active ? 'product-sidebar-link-active' : ''}`}
                      >
                        <Icon size={17} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>

                <div className="mt-auto rounded-2xl border border-white/55 bg-white/70 p-3 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-white/85 text-slate-700">
                      <UserCircle2 size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#1F2933]">{userDisplayName}</p>
                      <p className="text-xs text-[#6B7280]">Settings</p>
                    </div>
                    <button
                      type="button"
                      aria-label="Open settings"
                      onClick={() => router.push('/profile')}
                      className="grid h-9 w-9 place-items-center rounded-full border border-white/70 bg-white/85 text-slate-600 transition-colors hover:bg-white"
                    >
                      <Settings size={16} />
                    </button>
                  </div>
                </div>
              </aside>

              <section className="space-y-5">
                <div className="product-desktop-panel flex items-center gap-3 px-4 py-3">
                  <Search size={18} className="text-[#9CA3AF]" />
                  <input
                    type="text"
                    placeholder="Search products or brands"
                    className="w-full bg-transparent text-[15px] text-[#1F2933] placeholder:text-[#9CA3AF] outline-none"
                  />
                </div>

                <Card className="product-desktop-panel p-5">
                  <div className="grid grid-cols-[220px_minmax(0,1fr)] gap-6">
                    <div className="relative h-64 overflow-hidden rounded-3xl border border-white/65 bg-white/82">
                      <SafeImage
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-contain"
                        fallbackClassName="bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100"
                        iconClassName="h-10 w-10 text-slate-400"
                      />
                    </div>
                    <div className="space-y-3 pt-2">
                      <h2 className="text-[28px] font-bold leading-tight text-[#1F2933]">{product.name}</h2>
                      <p className="text-[26px] font-bold leading-none text-[#2E7D60]">{formatPKR(product.price)}</p>
                      <p className="max-w-2xl text-[14px] leading-relaxed text-[#6B7280]">
                        Compare this item across stores and pick the best deal before you checkout.
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-emerald-200/80 bg-emerald-100/70 px-3 py-1.5 text-[14px] font-semibold text-[#2E7D60]">
                          {matches.length} stores tracked
                        </span>
                        <span className="rounded-full border border-sky-200/80 bg-sky-100/75 px-3 py-1.5 text-[14px] font-semibold text-sky-700">
                          {product.matchedProductsCount}+ similar matches
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>

                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-[18px] font-semibold text-[#1F2933]">Compare Prices</h3>
                    <button
                      type="button"
                      onClick={() => {
                        if (bestStore) {
                          window.open(googleMapsQuery(bestStore.storeId), '_blank');
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/75 px-4 py-2 text-[14px] font-medium text-[#1F2933] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white"
                    >
                      Show on Map
                      <MapPin size={16} className="text-[#2E7D60]" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {desktopComparisonRows.map((item, index) => (
                      <button
                        key={item.productId || `${item.storeId}-${index}`}
                        type="button"
                        onClick={(event) => handleOpenComparedProduct(event, item.productId)}
                        className="product-desktop-panel product-compare-row flex w-full items-center gap-3 px-3 py-3 text-left"
                      >
                        <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/60 bg-white/78">
                          <SafeImage
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-contain"
                            fallbackClassName="bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100"
                            iconClassName="h-5 w-5 text-slate-400"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold text-[#1F2933]">{item.name}</p>
                          <p className="text-[14px] text-[#6B7280]">{item.storeId}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[16px] font-bold text-[#1F2933]">{formatPKR(item.price)}</p>
                          {cheapest && item.productId === cheapest.productId ? (
                            <span className="inline-flex rounded-full bg-emerald-100/85 px-2 py-1 text-[11px] font-semibold text-[#2E7D60]">Best ✓</span>
                          ) : null}
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              </section>

              <aside className="sticky top-4 self-start space-y-5">
                <Card className="product-desktop-panel p-4">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100/80 text-[#2E7D60]">
                      <Trophy size={14} />
                    </span>
                    <h3 className="text-[18px] font-semibold text-[#1F2933]">Best Price</h3>
                  </div>
                  <div className="mt-3 rounded-3xl border border-white/60 bg-white/72 p-3">
                    <p className="text-[15px] font-semibold text-[#1F2933]">{bestStore?.storeId ?? '-'}</p>
                    <p className="text-[28px] font-bold leading-tight text-[#2E7D60]">{bestStore ? formatPKR(bestStore.price) : '-'}</p>
                    <Button
                      size="sm"
                      className="mt-3 h-10 w-full rounded-full bg-[#2E7D60] text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_30px_-18px_rgba(46,125,96,0.9)]"
                      onClick={() => {
                        if (bestStore?.storeId) router.push(`/store/${encodeURIComponent(bestStore.storeId)}`);
                      }}
                    >
                      See Store Details
                    </Button>
                  </div>
                </Card>

                <Card className="product-desktop-panel p-4">
                  <p className="text-[18px] font-semibold text-[#1F2933]">Notice an outdated price?</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-[#6B7280]">
                    Help us keep comparisons accurate by reporting pricing issues.
                  </p>
                  <Button
                    variant="secondary"
                    fullWidth
                    className="mt-4 rounded-full border border-[#D5DFDA] bg-white/72 text-[14px] font-semibold text-[#1F2933]"
                    onClick={() => router.push(`/add-price?productId=${product.productId}`)}
                  >
                    Report Price Issue
                  </Button>
                </Card>
              </aside>
            </div>
          </div>

          <button
            type="button"
            aria-label="Open map"
            onClick={() => {
              if (bestStore) {
                window.open(googleMapsQuery(bestStore.storeId), '_blank');
              }
            }}
            className="product-map-fab hidden lg:grid"
          >
            <MapPin size={22} />
          </button>
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
        .product-desktop-shell {
          position: relative;
          border-radius: 1.75rem;
          padding: 1rem;
          background: linear-gradient(145deg, #f5f7f6 0%, #eaf2ef 52%, #f0f6f3 100%);
          border: 1px solid rgba(255, 255, 255, 0.72);
          box-shadow:
            0 34px 56px -44px rgba(15, 23, 42, 0.56),
            inset 0 1px 0 rgba(255, 255, 255, 0.78);
          overflow: hidden;
        }

        .product-desktop-shell::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background:
            radial-gradient(82% 66% at 12% 8%, rgba(126, 209, 168, 0.16), transparent 56%),
            radial-gradient(78% 62% at 88% 12%, rgba(125, 211, 252, 0.12), transparent 60%);
          pointer-events: none;
        }

        .product-desktop-panel {
          position: relative;
          border-radius: 1.35rem;
          border: 1px solid rgba(255, 255, 255, 0.44);
          background: rgba(255, 255, 255, 0.62);
          backdrop-filter: blur(20px) saturate(150%);
          -webkit-backdrop-filter: blur(20px) saturate(150%);
          box-shadow:
            0 20px 34px -30px rgba(15, 23, 42, 0.48),
            inset 0 1px 0 rgba(255, 255, 255, 0.74);
        }

        .product-desktop-sidebar {
          display: flex;
          min-height: calc(var(--app-dvh) - var(--desktop-top-nav-height) - 8.5rem);
          flex-direction: column;
          gap: 0.25rem;
          width: 240px;
        }

        .product-sidebar-logo {
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.82), rgba(232, 244, 238, 0.68));
          border: 1px solid rgba(255, 255, 255, 0.65);
          box-shadow:
            0 16px 24px -20px rgba(15, 23, 42, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        .product-sidebar-link {
          display: flex;
          width: 100%;
          align-items: center;
          gap: 0.75rem;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.56);
          padding: 0.625rem 0.875rem;
          font-size: 0.95rem;
          font-weight: 500;
          color: #1f2933;
          transition:
            transform 200ms cubic-bezier(0.2, 0.88, 0.22, 1),
            background-color 180ms ease,
            color 180ms ease,
            box-shadow 200ms ease;
        }

        .product-sidebar-link:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.82);
          box-shadow: 0 14px 22px -22px rgba(15, 23, 42, 0.62);
        }

        .product-sidebar-link-active {
          background: linear-gradient(132deg, rgba(126, 209, 168, 0.34), rgba(126, 209, 168, 0.22));
          color: #2e7d60;
          box-shadow:
            0 14px 24px -20px rgba(46, 125, 96, 0.56),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        .product-sidebar-link:disabled {
          cursor: default;
          opacity: 1;
        }

        .product-compare-row {
          transition:
            transform 190ms cubic-bezier(0.2, 0.88, 0.22, 1),
            box-shadow 190ms ease,
            border-color 190ms ease;
        }

        .product-compare-row:hover {
          transform: translateY(-1px);
          border-color: rgba(126, 209, 168, 0.5);
          box-shadow:
            0 22px 34px -28px rgba(15, 23, 42, 0.55),
            0 14px 22px -20px rgba(46, 125, 96, 0.4);
        }

        .product-map-fab {
          position: fixed;
          right: 2rem;
          bottom: 1.85rem;
          z-index: 35;
          height: 3.6rem;
          width: 3.6rem;
          place-items: center;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.74);
          color: #ffffff;
          background: linear-gradient(140deg, #2e7d60 0%, #1f9d74 55%, #7ed1a8 100%);
          box-shadow:
            0 24px 34px -20px rgba(46, 125, 96, 0.74),
            0 0 0 6px rgba(126, 209, 168, 0.18);
          transition:
            transform 210ms cubic-bezier(0.2, 0.9, 0.2, 1),
            box-shadow 220ms ease;
        }

        .product-map-fab:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow:
            0 28px 38px -18px rgba(46, 125, 96, 0.8),
            0 0 0 8px rgba(126, 209, 168, 0.22);
        }

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
          .details-modern-shimmer,
          .product-sidebar-link,
          .product-sidebar-link:hover,
          .product-compare-row,
          .product-compare-row:hover,
          .product-map-fab,
          .product-map-fab:hover {
            animation: none;
            transition: none;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
