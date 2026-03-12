'use client';

import { AlertCircle, RefreshCw, Sparkles, ShoppingBag, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { CSSProperties, KeyboardEvent } from 'react';

import { AppBar } from '@/components/navigation/AppBar';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { EmptyState } from '@/components/shared/EmptyState';
import { SafeImage } from '@/components/shared/SafeImage';
import { formatPKR } from '@/lib/formatters';
import { fetchFavoriteProducts, fetchProductWithMatches } from '@/lib/api';
import { useAppStore } from '@/store/app-store';
import { Product } from '@/types/product';

interface SavingRow {
  productId: string;
  name: string;
  storeName: string;
  price: number;
  isCheapest: boolean;
  minSavedAmount: number;
  maxSavedAmount: number;
  cheaperStore?: string;
  imageUrl: string;
}

const AI_ASSISTANT_STATE_KEY = 'qemat-ai-assistant-state-v1';

interface PersistedAssistantState {
  uid: string;
  rows: SavingRow[] | null;
  favorites: Product[];
  computedFavoritesSignature: string;
}

function AssistantLoadingState() {
  return (
    <div className="mt-5 space-y-3">
      <Card className="assistant-modern-card rounded-2xl border border-white/65 bg-white/85 p-4 shadow-[0_18px_30px_-24px_rgba(15,23,42,0.38)] backdrop-blur-xl">
        <div className="assistant-modern-shimmer h-4 w-32 rounded-md" />
        <div className="assistant-modern-shimmer mt-2 h-8 w-52 rounded-lg" />
      </Card>

      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={`assistant-loading-${index}`} className="assistant-modern-card rounded-2xl border border-gray-200/80 bg-white p-3.5">
          <div className="flex items-center gap-3">
            <div className="assistant-modern-shimmer h-12 w-12 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <div className="assistant-modern-shimmer h-4 w-10/12 rounded-md" />
              <div className="assistant-modern-shimmer h-3.5 w-7/12 rounded-md" />
              <div className="assistant-modern-shimmer h-3.5 w-8/12 rounded-md" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function AIAssistantPage() {
  const router = useRouter();
  const { user, favorites: favoriteIds, favoritesLoaded } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [rows, setRows] = useState<SavingRow[] | null>(null);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [computedFavoritesSignature, setComputedFavoritesSignature] = useState('');

  const favoritesSignature = useMemo(() => {
    if (!favoriteIds.length) return '';
    return [...favoriteIds].sort().join('|');
  }, [favoriteIds]);

  useEffect(() => {
    if (!user?.uid) {
      setRows(null);
      setFavorites([]);
      setComputedFavoritesSignature('');
      return;
    }

    const raw = sessionStorage.getItem(AI_ASSISTANT_STATE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as PersistedAssistantState;
      if (parsed.uid !== user.uid) return;
      setRows(parsed.rows ?? null);
      setFavorites(parsed.favorites ?? []);
      setComputedFavoritesSignature(parsed.computedFavoritesSignature ?? '');
    } catch (error) {
      console.error('Failed to restore assistant state.', error);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      sessionStorage.removeItem(AI_ASSISTANT_STATE_KEY);
      return;
    }

    const payload: PersistedAssistantState = {
      uid: user.uid,
      rows,
      favorites,
      computedFavoritesSignature
    };
    sessionStorage.setItem(AI_ASSISTANT_STATE_KEY, JSON.stringify(payload));
  }, [user?.uid, rows, favorites, computedFavoritesSignature]);

  useEffect(() => {
    let active = true;
    const loadFavorites = async () => {
      if (!user?.token) {
        setFavorites([]);
        return;
      }
      if (!favoritesLoaded) {
        return;
      }
      try {
        const products = await fetchFavoriteProducts(user.token);
        if (active) setFavorites(products);
      } catch (err) {
        console.error('Failed to load favorites for assistant.', err);
        if (active) setFavorites([]);
      }
    };

    void loadFavorites();
    return () => {
      active = false;
    };
  }, [favoritesLoaded, favoritesSignature, user?.token]);

  const totalSavings = rows?.reduce((sum, row) => sum + row.maxSavedAmount, 0) ?? 0;
  const averageSavingsPerItem = rows?.length ? totalSavings / rows.length : 0;
  const sortedRows = useMemo(() => {
    if (!rows) return [];
    return [...rows].sort((a, b) => b.maxSavedAmount - a.maxSavedAmount);
  }, [rows]);

  const runAssistant = useCallback(async (options?: { silent?: boolean }) => {
    if (!user?.token) return;
    const silent = Boolean(options?.silent);
    setError(false);
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setRows(null);
    }

    try {
      // Always fetch latest favorites on click so assistant uses current backend list.
      const latestFavorites = await fetchFavoriteProducts(user.token);
      setFavorites(latestFavorites);
      const nextSignature = latestFavorites.length ? [...latestFavorites].map((item) => item.productId).sort().join('|') : '';

      if (!latestFavorites.length) {
        setRows([]);
        setComputedFavoritesSignature(nextSignature);
        return;
      }

      const responses = await Promise.all(latestFavorites.map((product) => fetchProductWithMatches(product.productId)));

      const nextRows: SavingRow[] = responses.map(({ product, matches }) => {
        const related = [product, ...matches];
        const cheapest = related.reduce((lowest, current) => (current.price < lowest.price ? current : lowest), related[0]);

        const diffs = related
          .map((item) => product.price - item.price)
          .filter((value) => value > 0)
          .sort((a, b) => a - b);

        return {
          productId: product.productId,
          name: product.name,
          storeName: product.storeId,
          price: product.price,
          isCheapest: cheapest.productId === product.productId,
          minSavedAmount: diffs[0] ?? 0,
          maxSavedAmount: diffs[diffs.length - 1] ?? 0,
          cheaperStore: cheapest.storeId,
          imageUrl: product.imageUrl
        };
      });

      setRows(nextRows);
      setComputedFavoritesSignature(nextSignature);
    } catch {
      if (!silent) {
        setError(true);
      }
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [user?.token]);

  useEffect(() => {
    if (!user?.token) return;
    if (!favoritesLoaded) return;
    if (rows === null) return;
    if (loading || refreshing) return;

    const signaturesMatch = computedFavoritesSignature === favoritesSignature;
    if (signaturesMatch) return;

    void runAssistant({ silent: true });
  }, [computedFavoritesSignature, favoritesLoaded, favoritesSignature, loading, refreshing, rows, runAssistant, user?.token]);

  const openProductFromAssistant = (event: MouseEvent<HTMLElement>, productId: string) => {
    const href = `/product/${productId}`;
    const isModifiedClick = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
    if (isModifiedClick) return;

    const docWithTransition = document as Document & {
      startViewTransition?: (callback: () => void) => { finished: Promise<void> };
    };

    if (!docWithTransition.startViewTransition) {
      event.preventDefault();
      router.push(href);
      return;
    }

    event.preventDefault();
    const root = document.documentElement;
    const card = event.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();
    const originX = `${((rect.left + rect.width / 2) / window.innerWidth) * 100}%`;
    const originY = `${((rect.top + rect.height / 2) / window.innerHeight) * 100}%`;

    root.setAttribute('data-nav-intent', 'browse-open');
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

  const openProductFromAssistantKeyboard = (event: KeyboardEvent<HTMLElement>, productId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      router.push(`/product/${productId}`);
    }
  };

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 pb-8 lg:px-8">
      <AppBar title="AI Shopping Assistant" sticky />

      {!user ? (
        <EmptyState
          icon={<ShoppingBag className="text-gray-300" size={48} />}
          title="Sign in to use AI Assistant"
          description="Create an account and save favorite products to calculate your savings."
          action={
            <Link href="/sign-in">
              <Button>Sign In</Button>
            </Link>
          }
        />
      ) : loading ? (
        <AssistantLoadingState />
      ) : rows === null ? (
        <div className="mx-auto mt-12 flex max-w-xl flex-col items-center gap-5 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-green-100 text-brand-700">
            <ShoppingBag size={36} />
          </span>
          <Card className="assistant-modern-card w-full rounded-2xl border border-white/65 bg-white/85 shadow-[0_18px_30px_-24px_rgba(15,23,42,0.38)] backdrop-blur-xl">
            <p className="text-base leading-relaxed text-gray-700">
              Hi! I&apos;m your shopping assistant. Tap below and I&apos;ll analyze your favorites to show exactly where you can save more.
            </p>
          </Card>
          <Button loading={loading} size="lg" onClick={() => void runAssistant()} fullWidth>
            Get My Shopping List
          </Button>
          <p className="text-xs font-medium text-gray-500">
            {favorites.length ? `${favorites.length} favorite items ready for analysis` : 'We will use your latest favorites from backend'}
          </p>
        </div>
      ) : error ? (
        <EmptyState
          icon={<AlertCircle className="text-gray-300" size={48} />}
          title="Something went wrong"
          description="Failed to load your shopping list. Please try again."
          action={<Button onClick={() => void runAssistant()}>Retry</Button>}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="text-gray-300" size={48} />}
          title="Your shopping list is empty"
          description="Add products to your favorites first, then come back here to find where to buy them cheapest."
          action={
            <Link href="/search">
              <Button>Browse Products</Button>
            </Link>
          }
        />
      ) : (
        <div className="mt-4 space-y-3">
          <Card className="assistant-modern-card assistant-summary-card sticky top-3 z-20 rounded-2xl border border-emerald-200/85 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 shadow-[0_18px_30px_-24px_rgba(16,185,129,0.45)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Savings Summary</p>
                <p className="mt-1 text-[26px] font-extrabold leading-none text-emerald-700">{formatPKR(totalSavings)}</p>
                <p className="mt-1 text-xs font-medium text-gray-600">
                  {rows.length} items · avg {formatPKR(averageSavingsPerItem)} per item
                </p>
              </div>
              <div className="flex items-center gap-2">
                {refreshing ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    <RefreshCw size={11} className="animate-spin" />
                    Updating
                  </span>
                ) : null}
                <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <TrendingUp size={22} />
                </span>
              </div>
            </div>
          </Card>

          {sortedRows.map((row, index) => (
            <Card
              key={row.productId}
              className="assistant-modern-card assistant-row-card rounded-2xl border border-gray-200/80 bg-white p-3.5 shadow-[0_16px_24px_-24px_rgba(15,23,42,0.35)]"
              style={{ '--assistant-row-delay': `${Math.min(index, 9) * 58}ms` } as CSSProperties}
              role="link"
              tabIndex={0}
              onClick={(event) => openProductFromAssistant(event, row.productId)}
              onKeyDown={(event) => openProductFromAssistantKeyboard(event, row.productId)}
            >
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-gray-100">
                  <SafeImage
                    src={row.imageUrl}
                    alt={row.name}
                    fill
                    className="object-cover"
                    fallbackClassName="bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100"
                    iconClassName="h-4 w-4 text-slate-400"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{row.name}</p>
                  <p className="text-xs text-gray-600">
                    {formatPKR(row.price)} at {row.storeName}
                  </p>
                  {row.isCheapest ? (
                    <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                      Best price
                    </span>
                  ) : (
                    <p className="mt-1 text-xs font-semibold text-amber-700">
                      Save up to {formatPKR(row.maxSavedAmount)} at {row.cheaperStore}
                    </p>
                  )}
                </div>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                  <Sparkles size={16} />
                </span>
              </div>
            </Card>
          ))}

          <Button variant="secondary" onClick={() => setRows(null)}>
            Back to assistant
          </Button>
        </div>
      )}

      <style jsx global>{`
        .assistant-modern-shimmer {
          position: relative;
          overflow: hidden;
          background: linear-gradient(110deg, #f3f4f6 10%, #ffffff 40%, #e5e7eb 60%, #f3f4f6 90%);
          background-size: 220% 100%;
          animation: assistant-modern-shimmer 1.35s linear infinite;
        }

        .assistant-modern-card {
          opacity: 0;
          transform: translate3d(0, 14px, 0) scale(0.992);
          animation: assistant-card-in 560ms cubic-bezier(0.2, 0.88, 0.22, 1) forwards;
        }

        .assistant-summary-card {
          animation-delay: 45ms;
        }

        .assistant-row-card {
          animation-delay: var(--assistant-row-delay, 0ms);
          transition:
            transform 260ms cubic-bezier(0.2, 0.9, 0.2, 1),
            box-shadow 260ms ease;
        }

        .assistant-row-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 28px -24px rgba(15, 23, 42, 0.4);
        }

        @keyframes assistant-card-in {
          0% {
            opacity: 0;
            transform: translate3d(0, 14px, 0) scale(0.992);
            filter: blur(7px);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes assistant-modern-shimmer {
          0% {
            background-position: 120% 0;
          }
          100% {
            background-position: -120% 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .assistant-modern-shimmer {
            animation: none;
          }

          .assistant-modern-card {
            opacity: 1;
            transform: none;
            animation: none;
          }

          .assistant-row-card {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
