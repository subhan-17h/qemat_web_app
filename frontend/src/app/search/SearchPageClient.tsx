'use client';

import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { AppBar } from '@/components/navigation/AppBar';
import { EmptyState } from '@/components/shared/EmptyState';
import { Input } from '@/components/shared/Input';
import { ProductCard } from '@/components/shared/ProductCard';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { groceryCategories, storeIds } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { fetchProductsPage, searchProductsPage } from '@/lib/api';
import { useAppStore } from '@/store/app-store';
import { Product } from '@/types/product';

const PAGE_SIZE = 40;

export default function SearchPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { isFavorited, toggleFavorite } = useAppStore();

  const category = params.get('category');
  const pharma = params.get('pharma') === 'true';
  const browsing = params.get('browse') === 'true';

  const categoryTitle = category ? groceryCategories.find((item) => item.slug === category)?.name : null;

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<(typeof storeIds)[number]>('All Stores');
  const [sortBy, setSortBy] = useState<'relevance' | 'matchPriority' | 'priceAsc' | 'priceDesc' | 'nameAsc'>('matchPriority');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const type = pharma ? 'pharma' : 'grocery';
  const storeFilter = selectedStore !== 'All Stores' ? selectedStore : undefined;
  const categoryFilter = category ?? undefined;

  const hasMore = products.length < total;

  const loadPage = useCallback(
    async (offset: number, append: boolean) => {
      const fetcher = debouncedQuery
        ? searchProductsPage({
            type,
            query: debouncedQuery,
            limit: PAGE_SIZE,
            offset,
            store: storeFilter,
            category: categoryFilter,
            sort: sortBy
          })
        : fetchProductsPage({
            type,
            limit: PAGE_SIZE,
            offset,
            store: storeFilter,
            category: categoryFilter,
            sort: sortBy
          });

      const response = await fetcher;
      setTotal(response.total);
      setProducts((current) => (append ? [...current, ...response.products] : response.products));
    },
    [categoryFilter, debouncedQuery, sortBy, storeFilter, type]
  );

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        await loadPage(0, false);
      } catch (error) {
        console.error('Failed to load products.', error);
        if (active) {
          setProducts([]);
          setTotal(0);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [type, storeFilter, categoryFilter, debouncedQuery, sortBy, loadPage]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    if (!hasMore || loadingMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setLoadingMore(true);
          loadPage(products.length, true)
            .catch((error) => console.error('Failed to load more products.', error))
            .finally(() => setLoadingMore(false));
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, products.length, debouncedQuery, storeFilter, categoryFilter, sortBy, type, loadPage]);

  const closeSearch = () => {
    setSearchOpen(false);
    if (typeof document !== 'undefined') {
      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        active.blur();
      }
    }
  };

  const handleToggleFavorite = async (productId: string) => {
    try {
      await toggleFavorite(productId);
    } catch {
      router.push('/sign-in');
    }
  };

  const emptyDescription = useMemo(() => {
    if (category) return 'No products currently available in this category.';
    if (debouncedQuery) return 'Try a different keyword or store filter.';
    return 'No products available right now.';
  }, [category, debouncedQuery]);

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 pb-6 lg:px-8">
      <AppBar
        title={categoryTitle ?? (browsing ? 'Browse' : 'Search')}
        showBack
        sticky
        rightAction={
          <button
            aria-label="Open filters"
            onClick={() => setFiltersOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-full border border-black/20 bg-white/80 text-black backdrop-blur-xl"
          >
            <span className="flex flex-col items-center gap-1">
              <span className="h-[2px] w-4 rounded-full bg-black/90" />
              <span className="h-[2px] w-5 rounded-full bg-black/90" />
              <span className="h-[2px] w-3 rounded-full bg-black/90" />
            </span>
          </button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-2 gap-3 pt-3 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : products.length ? (
        <div className="grid grid-cols-2 gap-3 pt-3 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.productId}
              product={product}
              searchCompact
              showFavorite
              favorited={isFavorited(product.productId)}
              onFavoriteToggle={() => handleToggleFavorite(product.productId)}
            />
          ))}
        </div>
      ) : (
        <EmptyState icon={<Search className="text-gray-300" size={48} />} title="No products found" description={emptyDescription} />
      )}

      <div ref={sentinelRef} className="h-8" />
      {loadingMore ? (
        <div className="grid grid-cols-2 gap-3 pt-3 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={`more-${index}`} />
          ))}
        </div>
      ) : null}

      <button
        aria-label="Open search"
        onClick={() => setSearchOpen(true)}
        className="fixed bottom-6 right-5 z-40 grid h-16 w-16 place-items-center rounded-full border border-white/20 bg-black/20 text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-lg"
      >
        <Search size={34} strokeWidth={2.2} />
      </button>

      {filtersOpen ? (
        <>
          <div className="fixed inset-0 z-50 bg-black/12" onClick={() => setFiltersOpen(false)} />
          <div className="fixed right-4 top-[4.25rem] z-[60] w-[calc(100%-2rem)] max-w-sm">
            <div className="rounded-[1.35rem] border border-white/45 bg-white/24 p-3 backdrop-blur-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Filters & Sort</p>
                <button aria-label="Close filters" onClick={() => setFiltersOpen(false)} className="rounded-full p-1 text-gray-700 hover:bg-white/30">
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">Store</p>
                <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                  {storeIds.map((store) => (
                    <button
                      key={store}
                      onClick={() => setSelectedStore(store)}
                      className={cn(
                        'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-xl transition-colors',
                        selectedStore === store
                          ? 'border-brand-400/60 bg-brand-500/85 text-white'
                          : 'border-white/25 bg-black/20 text-white'
                      )}
                    >
                      {store}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">Sort</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'matchPriority', label: 'Relevance' },
                    { id: 'priceAsc', label: 'Price Low-High' },
                    { id: 'priceDesc', label: 'Price High-Low' },
                    { id: 'nameAsc', label: 'Name A-Z' }
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSortBy(option.id as typeof sortBy)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                        sortBy === option.id
                          ? 'border-brand-400/60 bg-brand-500/85 text-white'
                          : 'border-white/25 bg-black/20 text-white'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {searchOpen ? (
        <>
          <div className="fixed inset-0 z-50 bg-black/12" onClick={closeSearch} />
          <div className="fixed left-1/2 top-[4.2rem] z-[60] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2">
            <div onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center gap-2 rounded-full border border-white/35 bg-white/12 p-1.5 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl">
                <Input
                  autoFocus
                  className="text-base"
                  wrapperClassName="h-10 rounded-full border-gray-300/70 bg-white/82 focus-within:ring-0 focus-within:border-gray-300/70"
                  placeholder="Milk, Sugar, Rice..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  startSlot={<Search size={16} />}
                  endSlot={
                    query ? (
                      <button aria-label="Clear search" onClick={() => setQuery('')}>
                        <X size={16} />
                      </button>
                    ) : null
                  }
                />
                <button
                  aria-label="Close search"
                  onClick={closeSearch}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur-xl"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
