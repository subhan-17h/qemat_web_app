'use client';

import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { CSSProperties } from 'react';

import { AppBar } from '@/components/navigation/AppBar';
import { EmptyState } from '@/components/shared/EmptyState';
import { Input } from '@/components/shared/Input';
import { ProductCard } from '@/components/shared/ProductCard';
import { groceryCategories, storeIds } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { fetchProductsPage, searchProductsPage } from '@/lib/api';
import { useAppStore } from '@/store/app-store';
import { Product } from '@/types/product';

const PAGE_SIZE = 40;
const SHEET_EXIT_MS = 240;
const SORT_OPTIONS = ['matchPriority', 'priceAsc', 'priceDesc', 'nameAsc'] as const;
type SortKey = (typeof SORT_OPTIONS)[number];

function getTwoRowShimmerCount(width: number) {
  if (width >= 1280) return 10; // 5 columns
  if (width >= 1024) return 8; // 4 columns
  if (width >= 768) return 6; // 3 columns
  return 4; // 2 columns
}

function resolveSelectedStoreParam(value: string | null) {
  if (!value) return 'All Stores';
  const match = storeIds.find((store) => store.toLowerCase() === value.toLowerCase());
  return match ?? 'All Stores';
}

function resolveSortParam(value: string | null): SortKey {
  if (!value) return 'matchPriority';
  const match = SORT_OPTIONS.find((sort) => sort === value);
  return match ?? 'matchPriority';
}

function SearchShimmerGrid({ count, prefix }: { count: number; prefix: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 pt-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`${prefix}-${index}`}
          className="h-[218px] overflow-hidden rounded-[1.3rem] border border-gray-200/70 bg-white p-0 shadow-[0_9px_14px_-11px_rgba(15,23,42,0.40)]"
        >
          <div className="search-modern-shimmer h-28 w-full" />
          <div className="space-y-2 p-2.5">
            <div className="search-modern-shimmer h-4 w-11/12 rounded-md" />
            <div className="search-modern-shimmer h-4 w-8/12 rounded-md" />
            <div className="search-modern-shimmer h-4 w-7/12 rounded-md" />
            <div className="mt-1 flex items-center justify-between">
              <div className="search-modern-shimmer h-4 w-16 rounded-md" />
              <div className="search-modern-shimmer h-4 w-14 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchShimmerCard({ itemKey }: { itemKey: string }) {
  return (
    <div
      key={itemKey}
      className="h-[218px] overflow-hidden rounded-[1.3rem] border border-gray-200/70 bg-white p-0 shadow-[0_9px_14px_-11px_rgba(15,23,42,0.40)]"
    >
      <div className="search-modern-shimmer h-28 w-full" />
      <div className="space-y-2 p-2.5">
        <div className="search-modern-shimmer h-4 w-11/12 rounded-md" />
        <div className="search-modern-shimmer h-4 w-8/12 rounded-md" />
        <div className="search-modern-shimmer h-4 w-7/12 rounded-md" />
        <div className="mt-1 flex items-center justify-between">
          <div className="search-modern-shimmer h-4 w-16 rounded-md" />
          <div className="search-modern-shimmer h-4 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const { isFavorited, isFavoriteSyncing, toggleFavorite } = useAppStore();

  const category = params.get('category');
  const pharma = params.get('pharma') === 'true';
  const browsing = params.get('browse') === 'true';

  const categoryTitle = category ? groceryCategories.find((item) => item.slug === category)?.name : null;

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchClosing, setSearchClosing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filtersClosing, setFiltersClosing] = useState(false);
  const [searchFabBurst, setSearchFabBurst] = useState(false);
  const [filterTriggerBurst, setFilterTriggerBurst] = useState(false);
  const [storeChipPillStyle, setStoreChipPillStyle] = useState<CSSProperties>({ opacity: 0 });
  const [sortChipPillStyle, setSortChipPillStyle] = useState<CSSProperties>({ opacity: 0 });
  const [selectedStore, setSelectedStore] = useState<(typeof storeIds)[number]>(() => resolveSelectedStoreParam(params.get('store')));
  const [sortBy, setSortBy] = useState<SortKey>(() => resolveSortParam(params.get('sort')));
  const [shimmerCount, setShimmerCount] = useState(() => (typeof window === 'undefined' ? 10 : getTwoRowShimmerCount(window.innerWidth)));

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const productCardRefs = useRef(new Map<string, HTMLDivElement>());
  const visibleProductCards = useRef(new Set<HTMLDivElement>());
  const parallaxFrame = useRef<number | null>(null);
  const storeChipTrackRef = useRef<HTMLDivElement | null>(null);
  const sortChipTrackRef = useRef<HTMLDivElement | null>(null);
  const storeChipRefs = useRef(new Map<(typeof storeIds)[number], HTMLButtonElement>());
  const sortChipRefs = useRef(new Map<string, HTMLButtonElement>());
  const searchCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filtersCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchFabTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterTriggerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncShimmerCount = () => {
      setShimmerCount(getTwoRowShimmerCount(window.innerWidth));
    };

    syncShimmerCount();
    window.addEventListener('resize', syncShimmerCount);
    return () => {
      window.removeEventListener('resize', syncShimmerCount);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (searchCloseTimerRef.current) clearTimeout(searchCloseTimerRef.current);
      if (filtersCloseTimerRef.current) clearTimeout(filtersCloseTimerRef.current);
      if (searchFabTimerRef.current) clearTimeout(searchFabTimerRef.current);
      if (filterTriggerTimerRef.current) clearTimeout(filterTriggerTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const nextStore = resolveSelectedStoreParam(params.get('store'));
    const nextSort = resolveSortParam(params.get('sort'));
    setSelectedStore((current) => (current === nextStore ? current : nextStore));
    setSortBy((current) => (current === nextSort ? current : nextSort));
  }, [params]);

  const updateFilterParams = useCallback(
    (nextStore: (typeof storeIds)[number], nextSort: SortKey) => {
      const nextParams = new URLSearchParams(params.toString());

      if (nextStore === 'All Stores') {
        nextParams.delete('store');
      } else {
        nextParams.set('store', nextStore);
      }

      if (nextSort === 'matchPriority') {
        nextParams.delete('sort');
      } else {
        nextParams.set('sort', nextSort);
      }

      const nextHref = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;
      router.replace(nextHref, { scroll: false });
    },
    [params, pathname, router]
  );

  const handleStoreChange = useCallback(
    (nextStore: (typeof storeIds)[number]) => {
      setSelectedStore(nextStore);
      updateFilterParams(nextStore, sortBy);
    },
    [sortBy, updateFilterParams]
  );

  const handleSortChange = useCallback(
    (nextSort: SortKey) => {
      setSortBy(nextSort);
      updateFilterParams(selectedStore, nextSort);
    },
    [selectedStore, updateFilterParams]
  );

  const type = pharma ? 'pharma' : 'grocery';
  const storeFilter = selectedStore !== 'All Stores' ? selectedStore : undefined;
  const categoryFilter = category ?? undefined;

  const hasMore = products.length < total;

  const registerProductCard = useCallback(
    (productId: string) => (node: HTMLDivElement | null) => {
      const existingNode = productCardRefs.current.get(productId);
      if (existingNode && existingNode !== node) {
        visibleProductCards.current.delete(existingNode);
      }

      if (node) {
        productCardRefs.current.set(productId, node);
        return;
      }

      if (existingNode) {
        productCardRefs.current.delete(productId);
        visibleProductCards.current.delete(existingNode);
      }
    },
    []
  );

  const registerStoreChip = useCallback(
    (store: (typeof storeIds)[number]) => (node: HTMLButtonElement | null) => {
      if (node) {
        storeChipRefs.current.set(store, node);
      } else {
        storeChipRefs.current.delete(store);
      }
    },
    []
  );

  const registerSortChip = useCallback(
    (sortKey: string) => (node: HTMLButtonElement | null) => {
      if (node) {
        sortChipRefs.current.set(sortKey, node);
      } else {
        sortChipRefs.current.delete(sortKey);
      }
    },
    []
  );

  const syncStoreChipPill = useCallback(() => {
    const track = storeChipTrackRef.current;
    const activeChip = storeChipRefs.current.get(selectedStore);
    if (!track || !activeChip) {
      setStoreChipPillStyle({ opacity: 0 });
      return;
    }

    setStoreChipPillStyle({
      transform: `translate3d(${activeChip.offsetLeft}px, ${activeChip.offsetTop}px, 0)`,
      width: `${activeChip.offsetWidth}px`,
      height: `${activeChip.offsetHeight}px`,
      opacity: 1
    });
  }, [selectedStore]);

  const syncSortChipPill = useCallback(() => {
    const track = sortChipTrackRef.current;
    const activeChip = sortChipRefs.current.get(sortBy);
    if (!track || !activeChip) {
      setSortChipPillStyle({ opacity: 0 });
      return;
    }

    setSortChipPillStyle({
      transform: `translate3d(${activeChip.offsetLeft}px, ${activeChip.offsetTop}px, 0)`,
      width: `${activeChip.offsetWidth}px`,
      height: `${activeChip.offsetHeight}px`,
      opacity: 1
    });
  }, [sortBy]);

  const queueParallaxUpdate = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (parallaxFrame.current !== null) return;

    parallaxFrame.current = window.requestAnimationFrame(() => {
      parallaxFrame.current = null;
      const viewportCenter = window.innerHeight * 0.5;

      visibleProductCards.current.forEach((card) => {
        const rect = card.getBoundingClientRect();
        if (rect.bottom < -50 || rect.top > window.innerHeight + 50) return;

        const center = rect.top + rect.height * 0.5;
        const ratio = Math.max(-1, Math.min(1, (center - viewportCenter) / viewportCenter));
        const shift = ratio * -15;
        const tilt = ratio * -2.4;
        const scale = 1 - Math.abs(ratio) * 0.03;

        card.style.setProperty('--card-parallax-y', `${shift.toFixed(2)}px`);
        card.style.setProperty('--card-parallax-tilt', `${tilt.toFixed(2)}deg`);
        card.style.setProperty('--card-parallax-scale', `${scale.toFixed(3)}`);
      });
    });
  }, []);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (loading || !products.length) return;

    const cards = Array.from(productCardRefs.current.values());
    if (!cards.length) return;
    const visibleCards = visibleProductCards.current;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      cards.forEach((card) => {
        card.dataset.visible = 'true';
        card.style.removeProperty('--card-parallax-y');
        card.style.removeProperty('--card-parallax-tilt');
        card.style.removeProperty('--card-parallax-scale');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const card = entry.target as HTMLDivElement;
          if (entry.isIntersecting) {
            card.dataset.visible = 'true';
            visibleCards.add(card);
          } else {
            visibleCards.delete(card);
            card.style.setProperty('--card-parallax-y', '0px');
            card.style.setProperty('--card-parallax-tilt', '0deg');
            card.style.setProperty('--card-parallax-scale', '1');
          }
        });
        queueParallaxUpdate();
      },
      { rootMargin: '220px 0px', threshold: [0, 0.15, 0.45] }
    );

    cards.forEach((card) => observer.observe(card));
    queueParallaxUpdate();
    window.addEventListener('scroll', queueParallaxUpdate, { passive: true });
    window.addEventListener('resize', queueParallaxUpdate);

    return () => {
      observer.disconnect();
      visibleCards.clear();
      window.removeEventListener('scroll', queueParallaxUpdate);
      window.removeEventListener('resize', queueParallaxUpdate);
      if (parallaxFrame.current !== null) {
        window.cancelAnimationFrame(parallaxFrame.current);
        parallaxFrame.current = null;
      }
    };
  }, [loading, products.length, queueParallaxUpdate]);

  useEffect(() => {
    if (!filtersOpen) return;
    const raf = window.requestAnimationFrame(() => {
      syncStoreChipPill();
      syncSortChipPill();
    });

    return () => window.cancelAnimationFrame(raf);
  }, [filtersOpen, selectedStore, sortBy, syncStoreChipPill, syncSortChipPill]);

  useEffect(() => {
    if (!filtersOpen) return;

    const handleResize = () => {
      syncStoreChipPill();
      syncSortChipPill();
    };

    const track = storeChipTrackRef.current;
    track?.addEventListener('scroll', syncStoreChipPill, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      track?.removeEventListener('scroll', syncStoreChipPill);
      window.removeEventListener('resize', handleResize);
    };
  }, [filtersOpen, syncStoreChipPill, syncSortChipPill]);

  const blurActiveElement = () => {
    if (typeof document !== 'undefined') {
      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        active.blur();
      }
    }
  };

  const openSearch = () => {
    if (searchFabTimerRef.current) clearTimeout(searchFabTimerRef.current);
    setSearchFabBurst(true);
    searchFabTimerRef.current = setTimeout(() => setSearchFabBurst(false), 420);

    if (searchCloseTimerRef.current) {
      clearTimeout(searchCloseTimerRef.current);
      searchCloseTimerRef.current = null;
    }
    setSearchClosing(false);
    setSearchOpen(true);
  };

  const closeSearch = () => {
    if (!searchOpen || searchClosing) return;
    setSearchClosing(true);
    if (searchCloseTimerRef.current) clearTimeout(searchCloseTimerRef.current);
    searchCloseTimerRef.current = setTimeout(() => {
      setSearchOpen(false);
      setSearchClosing(false);
      blurActiveElement();
      searchCloseTimerRef.current = null;
    }, SHEET_EXIT_MS);
  };

  const openFilters = () => {
    if (filterTriggerTimerRef.current) clearTimeout(filterTriggerTimerRef.current);
    setFilterTriggerBurst(true);
    filterTriggerTimerRef.current = setTimeout(() => setFilterTriggerBurst(false), 420);

    if (filtersCloseTimerRef.current) {
      clearTimeout(filtersCloseTimerRef.current);
      filtersCloseTimerRef.current = null;
    }
    setFiltersClosing(false);
    setFiltersOpen(true);
  };

  const closeFilters = () => {
    if (!filtersOpen || filtersClosing) return;
    setFiltersClosing(true);
    if (filtersCloseTimerRef.current) clearTimeout(filtersCloseTimerRef.current);
    filtersCloseTimerRef.current = setTimeout(() => {
      setFiltersOpen(false);
      setFiltersClosing(false);
      filtersCloseTimerRef.current = null;
    }, SHEET_EXIT_MS);
  };

  const handleToggleFavorite = async (product: Product) => {
    try {
      await toggleFavorite(product.productId, product);
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
    <div className="mx-auto w-full max-w-screen-2xl px-4 pb-6 lg:px-10 xl:px-12">
      <AppBar
        title={categoryTitle ?? (browsing ? 'Browse' : 'Search')}
        showBack
        sticky
        rightAction={
          <button
            aria-label="Open filters"
            onClick={openFilters}
            className={cn(
              'search-filter-trigger grid h-9 w-9 place-items-center rounded-full border border-black/20 bg-white/80 text-black backdrop-blur-xl',
              filterTriggerBurst ? 'search-filter-trigger-burst' : ''
            )}
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
        <SearchShimmerGrid count={shimmerCount} prefix="search-shimmer" />
      ) : products.length ? (
        <div className="search-scroll-grid grid grid-cols-2 gap-x-3 gap-y-4 pt-3 md:grid-cols-3 md:gap-y-5 lg:gap-x-4 lg:gap-y-6 xl:grid-cols-5">
          {products.map((product, index) => (
            <div
              key={product.productId}
              role="link"
              tabIndex={0}
              ref={registerProductCard(product.productId)}
              data-visible="false"
              onClick={() => router.push(`/product/${product.productId}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  router.push(`/product/${product.productId}`);
                }
              }}
              className="search-scroll-card block h-full cursor-pointer"
              style={
                {
                  '--card-enter-delay': `${Math.min(index, 10) * 38}ms`
                } as CSSProperties
              }
            >
              <div className="search-scroll-card-inner h-full">
                <ProductCard
                  product={product}
                  searchCompact
                  showFavorite
                  favorited={isFavorited(product.productId)}
                  favoriteSyncing={isFavoriteSyncing(product.productId)}
                  onFavoriteToggle={() => handleToggleFavorite(product)}
                />
              </div>
            </div>
          ))}

          {loadingMore
            ? Array.from({ length: shimmerCount }).map((_, index) => (
                <SearchShimmerCard key={`search-more-shimmer-${index}`} itemKey={`search-more-shimmer-${index}`} />
              ))
            : null}
        </div>
      ) : (
        <EmptyState icon={<Search className="text-gray-300" size={48} />} title="No products found" description={emptyDescription} />
      )}

      <div ref={sentinelRef} className="h-8" />

      <button
        aria-label="Open search"
        onClick={openSearch}
        className={cn(
          'search-fab fixed bottom-6 right-5 z-40 grid h-16 w-16 place-items-center rounded-full border border-white/26 bg-white/24 text-gray-900 shadow-[0_20px_36px_-24px_rgba(15,23,42,0.7),inset_0_1px_0_rgba(255,255,255,0.42)] backdrop-blur-xl lg:bottom-8 lg:right-8 lg:h-14 lg:w-14',
          searchFabBurst ? 'search-fab-burst' : ''
        )}
      >
        <Search size={30} strokeWidth={2.2} />
      </button>

      {filtersOpen ? (
        <>
          <div
            className={cn('filters-overlay fixed inset-0 z-50 bg-black/12', filtersClosing ? 'is-leaving' : '')}
            onClick={closeFilters}
          />
          <div className="fixed right-4 top-[4.25rem] z-[60] w-[calc(100%-2rem)] max-w-sm lg:right-10 lg:top-[6.25rem] xl:right-12">
            <div
              className={cn(
                'filters-sheet rounded-[1.35rem] border border-white/45 bg-white/24 p-3 backdrop-blur-2xl',
                filtersClosing ? 'is-leaving' : ''
              )}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Filters & Sort</p>
                <button aria-label="Close filters" onClick={closeFilters} className="rounded-full p-1 text-gray-700 hover:bg-white/30">
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">Store</p>
                <div ref={storeChipTrackRef} className="filter-chip-track no-scrollbar flex gap-2 overflow-x-auto pb-1">
                  <span className="filter-chip-pill" style={storeChipPillStyle} aria-hidden />
                  {storeIds.map((store) => (
                    <button
                      key={store}
                      ref={registerStoreChip(store)}
                      onClick={() => handleStoreChange(store)}
                      data-active={selectedStore === store}
                      className={cn(
                        'filter-chip-btn whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-xl transition-colors',
                        selectedStore === store
                          ? 'bg-transparent text-white'
                          : 'bg-black/20 text-white'
                      )}
                    >
                      {store}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">Sort</p>
                <div ref={sortChipTrackRef} className="filter-chip-track grid grid-cols-2 gap-2">
                  <span className="filter-chip-pill" style={sortChipPillStyle} aria-hidden />
                  {[
                    { id: 'matchPriority', label: 'Relevance' },
                    { id: 'priceAsc', label: 'Price Low-High' },
                    { id: 'priceDesc', label: 'Price High-Low' },
                    { id: 'nameAsc', label: 'Name A-Z' }
                  ].map((option) => (
                    <button
                      key={option.id}
                      ref={registerSortChip(option.id)}
                      onClick={() => handleSortChange(option.id as SortKey)}
                      data-active={sortBy === option.id}
                      className={cn(
                        'filter-chip-btn rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                        sortBy === option.id
                          ? 'bg-transparent text-white'
                          : 'bg-black/20 text-white'
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
          <div className={cn('search-overlay fixed inset-0 z-50 bg-black/12', searchClosing ? 'is-leaving' : '')} onClick={closeSearch} />
          <div className="fixed left-1/2 top-[4.2rem] z-[60] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 lg:top-[6.2rem]">
            <div onClick={(event) => event.stopPropagation()}>
              <div
                className={cn(
                  'search-command-sheet flex items-center gap-2 rounded-full border border-white/35 bg-white/12 p-1.5 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl',
                  searchClosing ? 'is-leaving' : ''
                )}
              >
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

      <style jsx global>{`
        .search-scroll-grid {
          perspective: 1000px;
        }

        .search-fab {
          transition:
            transform 220ms cubic-bezier(0.2, 0.9, 0.22, 1),
            background-color 200ms ease,
            box-shadow 260ms ease;
        }

        .search-fab:hover {
          transform: translateY(-1px) scale(1.02);
          background-color: rgba(255, 255, 255, 0.28);
          box-shadow:
            0 12px 24px -16px rgba(15, 23, 42, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.35);
        }

        .search-fab:active {
          transform: scale(0.95);
        }

        .search-fab-burst {
          animation: search-fab-burst 420ms cubic-bezier(0.2, 0.9, 0.22, 1);
        }

        .search-filter-trigger {
          transition:
            transform 220ms cubic-bezier(0.2, 0.9, 0.22, 1),
            box-shadow 240ms ease,
            background-color 200ms ease;
        }

        .search-filter-trigger:hover {
          transform: translateY(-1px);
          background-color: rgba(255, 255, 255, 0.95);
          box-shadow: 0 8px 18px -12px rgba(15, 23, 42, 0.42);
        }

        .search-filter-trigger:active {
          transform: scale(0.94);
        }

        .search-filter-trigger-burst {
          animation: filter-trigger-burst 380ms cubic-bezier(0.2, 0.9, 0.22, 1);
        }

        .filter-chip-track {
          position: relative;
          isolation: isolate;
        }

        .filter-chip-pill {
          position: absolute;
          left: 0;
          top: 0;
          z-index: 0;
          border-radius: 9999px;
          background: linear-gradient(140deg, #34d399 0%, #10b981 60%, #059669 100%);
          box-shadow:
            0 10px 22px -14px rgba(16, 185, 129, 0.95),
            inset 0 1px 0 rgba(255, 255, 255, 0.45);
          transform: translate3d(0, 0, 0);
          opacity: 0;
          transition:
            transform 420ms cubic-bezier(0.2, 0.9, 0.2, 1),
            width 420ms cubic-bezier(0.2, 0.9, 0.2, 1),
            height 420ms cubic-bezier(0.2, 0.9, 0.2, 1),
            opacity 220ms ease;
          animation: filter-chip-pill-pop 420ms cubic-bezier(0.2, 0.9, 0.2, 1);
          pointer-events: none;
        }

        .filter-chip-btn {
          position: relative;
          z-index: 1;
          transition:
            color 240ms ease,
            border-color 240ms ease,
            background-color 240ms ease,
            transform 240ms cubic-bezier(0.2, 0.9, 0.2, 1);
        }

        .filter-chip-btn:hover {
          transform: translateY(-1px);
        }

        .filter-chip-btn:active {
          transform: scale(0.95);
        }

        .filter-chip-btn[data-active='true'] {
          transform: translateY(0);
        }

        .search-overlay,
        .filters-overlay {
          animation: floating-overlay-in 220ms ease forwards;
        }

        .search-overlay.is-leaving,
        .filters-overlay.is-leaving {
          animation: floating-overlay-out ${SHEET_EXIT_MS}ms ease forwards;
        }

        .search-command-sheet {
          transform-origin: center top;
          animation: search-command-in 420ms cubic-bezier(0.16, 0.96, 0.22, 1) forwards;
        }

        .search-command-sheet.is-leaving {
          animation: search-command-out ${SHEET_EXIT_MS}ms cubic-bezier(0.32, 0.01, 0.67, 0.99) forwards;
        }

        .filters-sheet {
          transform-origin: top right;
          animation: filters-sheet-in 360ms cubic-bezier(0.16, 0.96, 0.22, 1) forwards;
        }

        .filters-sheet.is-leaving {
          animation: filters-sheet-out ${SHEET_EXIT_MS}ms cubic-bezier(0.32, 0.01, 0.67, 0.99) forwards;
        }

        .search-scroll-card {
          opacity: 0;
          transform: translate3d(0, 22px, 0);
          filter: saturate(0.9);
          transition:
            opacity 520ms cubic-bezier(0.22, 1, 0.36, 1),
            transform 600ms cubic-bezier(0.22, 1, 0.36, 1),
            filter 520ms ease;
          transition-delay: var(--card-enter-delay, 0ms);
        }

        .search-scroll-card[data-visible='true'] {
          opacity: 1;
          transform: translate3d(0, 0, 0);
          filter: saturate(1);
        }

        .search-scroll-card-inner {
          height: 100%;
          will-change: transform;
          transform: translate3d(0, var(--card-parallax-y, 0px), 0) rotateX(var(--card-parallax-tilt, 0deg))
            scale(var(--card-parallax-scale, 1));
          transform-origin: center center;
          transition: transform 180ms cubic-bezier(0.2, 0.88, 0.32, 1);
        }

        .search-modern-shimmer {
          position: relative;
          overflow: hidden;
          background: linear-gradient(110deg, #f3f4f6 10%, #ffffff 40%, #e5e7eb 60%, #f3f4f6 90%);
          background-size: 220% 100%;
          animation: search-modern-shimmer 1.4s linear infinite;
        }

        @keyframes search-modern-shimmer {
          0% {
            background-position: 120% 0;
          }
          100% {
            background-position: -120% 0;
          }
        }

        @keyframes search-fab-burst {
          0% {
            transform: scale(1);
          }
          30% {
            transform: scale(0.92);
          }
          62% {
            transform: scale(1.08);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes filter-trigger-burst {
          0% {
            transform: scale(1);
          }
          42% {
            transform: scale(0.92);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes filter-chip-pill-pop {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes floating-overlay-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes floating-overlay-out {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes search-command-in {
          0% {
            opacity: 0;
            transform: translate3d(0, -16px, 0) scale(0.92);
            filter: blur(10px);
          }
          60% {
            opacity: 1;
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes search-command-out {
          0% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0);
          }
          100% {
            opacity: 0;
            transform: translate3d(0, -8px, 0) scale(0.96);
            filter: blur(8px);
          }
        }

        @keyframes filters-sheet-in {
          0% {
            opacity: 0;
            transform: translate3d(14px, -10px, 0) scale(0.9);
            filter: blur(10px);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes filters-sheet-out {
          0% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0);
          }
          100% {
            opacity: 0;
            transform: translate3d(10px, -8px, 0) scale(0.94);
            filter: blur(8px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .search-fab,
          .search-fab:hover,
          .search-fab:active,
          .search-fab-burst,
          .search-filter-trigger,
          .search-filter-trigger:hover,
          .search-filter-trigger:active,
          .search-filter-trigger-burst,
          .filter-chip-pill,
          .filter-chip-btn,
          .filter-chip-btn:hover,
          .filter-chip-btn:active,
          .search-overlay,
          .search-overlay.is-leaving,
          .filters-overlay,
          .filters-overlay.is-leaving,
          .search-command-sheet,
          .search-command-sheet.is-leaving,
          .filters-sheet,
          .filters-sheet.is-leaving {
            animation: none;
            transform: none;
            transition: none;
            filter: none;
          }

          .search-scroll-card,
          .search-scroll-card[data-visible='true'] {
            opacity: 1;
            transform: none;
            filter: none;
            transition: none;
          }

          .search-scroll-card-inner {
            transition: none;
            transform: none !important;
          }

          .search-modern-shimmer {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
