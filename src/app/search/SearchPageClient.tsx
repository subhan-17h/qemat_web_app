'use client';

import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { AppBar } from '@/components/navigation/AppBar';
import { EmptyState } from '@/components/shared/EmptyState';
import { Input } from '@/components/shared/Input';
import { ProductCard } from '@/components/shared/ProductCard';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { groceryCategories, storeIds } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';

export default function SearchPage() {
  const params = useSearchParams();
  const { products, loadingProducts } = useAppStore();

  const category = params.get('category');
  const pharma = params.get('pharma') === 'true';
  const browsing = params.get('browse') === 'true';

  const categoryTitle = category ? groceryCategories.find((item) => item.slug === category)?.name : null;

  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<(typeof storeIds)[number]>('All Stores');
  const [sortBy, setSortBy] = useState<'relevance' | 'priceAsc' | 'priceDesc' | 'nameAsc'>('relevance');

  const filtered = useMemo(() => {
    let list = products;

    if (pharma) {
      list = list.filter((item) => item.isPharma);
    } else {
      list = list.filter((item) => !item.isPharma);
    }

    if (category) {
      list = list.filter((item) => item.category === category);
    }

    if (selectedStore !== 'All Stores') {
      list = list.filter((item) => item.storeId === selectedStore);
    }

    if (query.trim()) {
      const normalized = query.toLowerCase();
      list = list.filter((item) => item.name.toLowerCase().includes(normalized));
    }

    const sorted = [...list];

    if (sortBy === 'priceAsc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'priceDesc') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'nameAsc') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }

    return sorted;
  }, [products, pharma, category, selectedStore, query, sortBy]);

  const closeSearch = () => {
    setSearchOpen(false);
    if (typeof document !== 'undefined') {
      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        active.blur();
      }
    }
  };

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
            className="grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur-xl"
          >
            <span className="flex flex-col items-center gap-1">
              <span className="h-[2px] w-4 rounded-full bg-white/90" />
              <span className="h-[2px] w-5 rounded-full bg-white/90" />
              <span className="h-[2px] w-3 rounded-full bg-white/90" />
            </span>
          </button>
        }
      />

      {loadingProducts ? (
        <div className="grid grid-cols-2 gap-3 pt-3 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : filtered.length ? (
        <div className="grid grid-cols-2 gap-3 pt-3 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.productId} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Search className="text-gray-300" size={48} />}
          title="No products found"
          description={category ? 'No products currently available in this category.' : 'Try a different keyword or store filter.'}
        />
      )}

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
                    { id: 'relevance', label: 'Relevance' },
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
            <div
              className="rounded-[1.25rem] border border-white/45 bg-white/26 p-3 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <Input
                  autoFocus
                  className="text-base"
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
