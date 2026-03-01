'use client';

import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { AppBar } from '@/components/navigation/AppBar';
import { Chip } from '@/components/shared/Chip';
import { EmptyState } from '@/components/shared/EmptyState';
import { Input } from '@/components/shared/Input';
import { ProductCard } from '@/components/shared/ProductCard';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { groceryCategories, storeIds } from '@/lib/mock-data';
import { useAppStore } from '@/store/app-store';

export default function SearchPage() {
  const params = useSearchParams();
  const { products, loadingProducts } = useAppStore();

  const category = params.get('category');
  const pharma = params.get('pharma') === 'true';
  const browsing = params.get('browse') === 'true';

  const categoryTitle = category ? groceryCategories.find((item) => item.slug === category)?.name : null;

  const [query, setQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState<(typeof storeIds)[number]>('All Stores');

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

    return list;
  }, [products, pharma, category, selectedStore, query]);

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 pb-8 lg:px-8">
      <AppBar title={categoryTitle ?? (browsing ? 'Browse' : 'Search')} showBack />

      <div className="sticky top-3 z-30 space-y-3 bg-white/95 py-3 backdrop-blur">
        <Input
          placeholder="Search for a product, e.g., Milk, Sugar, Rice..."
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

        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {storeIds.map((store) => (
            <Chip key={store} selected={selectedStore === store} onClick={() => setSelectedStore(store)}>
              {store}
            </Chip>
          ))}
        </div>
      </div>

      {loadingProducts ? (
        <div className="grid grid-cols-2 gap-3 pt-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : filtered.length ? (
        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
    </div>
  );
}
