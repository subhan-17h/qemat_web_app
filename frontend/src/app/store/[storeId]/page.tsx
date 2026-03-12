'use client';

import Link from 'next/link';
import { Clock3, MapPin, Phone, Share2, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { AppBar } from '@/components/navigation/AppBar';
import { DesktopSectionHeader } from '@/components/navigation/DesktopSectionHeader';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatPKR, googleMapsQuery } from '@/lib/formatters';
import { stores } from '@/lib/mock-data';
import { fetchProductsPage } from '@/lib/api';
import { Product } from '@/types/product';

const PAGE_SIZE = 80;

export default function StoreProfilePage() {
  const params = useParams<{ storeId: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const store = stores.find((item) => item.id === decodeURIComponent(params.storeId));

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!store) return;
      setLoading(true);
      try {
        const response = await fetchProductsPage({
          type: 'grocery',
          store: store.id,
          limit: PAGE_SIZE,
          offset: 0,
          sort: 'nameAsc'
        });
        if (active) {
          setProducts(response.products);
          setOffset(response.products.length);
          setTotal(response.total);
        }
      } catch (error) {
        console.error('Failed to load store products.', error);
        if (active) {
          setProducts([]);
          setTotal(0);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [store]);

  const loadMore = async () => {
    if (!store) return;
    const response = await fetchProductsPage({
      type: 'grocery',
      store: store.id,
      limit: PAGE_SIZE,
      offset,
      sort: 'nameAsc'
    });
    setProducts((current) => [...current, ...response.products]);
    setOffset(offset + response.products.length);
    setTotal(response.total);
  };

  if (!store) {
    return (
      <div className="mx-auto w-full max-w-screen-2xl px-4 lg:px-10 xl:px-12">
        <AppBar title="Store Profile" showBack sticky />
        <DesktopSectionHeader title="Store Profile" showBack />
        <EmptyState icon={<MapPin className="text-gray-300" size={48} />} title="Store not found" description="Store details are unavailable." />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 pb-8 lg:px-10 xl:px-12">
      <AppBar
        title="Store Profile"
        showBack
        sticky
        rightAction={
          <button
            aria-label="Share store"
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="rounded-full p-2 text-gray-700 hover:bg-gray-100"
          >
            <Share2 size={18} />
          </button>
        }
      />
      <DesktopSectionHeader
        title="Store Profile"
        subtitle={store.id}
        showBack
        rightAction={
          <button
            aria-label="Share store"
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="rounded-full border border-gray-200 bg-white p-2 text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Share2 size={17} />
          </button>
        }
      />

      <Card className="mt-4 flex items-center gap-4">
        <span className="grid h-[70px] w-[70px] place-items-center rounded-2xl bg-green-100 text-brand-700">{store.id.slice(0, 2)}</span>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{store.id}</h2>
          <p className="text-sm text-gray-500">{store.location}</p>
          <p className="mt-1 flex items-center gap-1 text-sm text-gray-700">
            <Star size={14} className="fill-amber-400 text-amber-400" /> {store.rating} <span className="text-gray-500">({store.reviews} reviews)</span>
          </p>
        </div>
      </Card>

      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
        <Card>
          <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Clock3 size={14} /> Hours
          </p>
          <p className="text-xs text-gray-600">{store.hours}</p>
        </Card>
        <Card>
          <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Phone size={14} /> Phone
          </p>
          <p className="text-xs text-gray-600">{store.phone}</p>
        </Card>
        <Card>
          <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <MapPin size={14} /> Location
          </p>
          <p className="text-xs text-gray-600">{store.location}</p>
        </Card>
      </div>

      <div className="mt-3">
        <Button variant="secondary" fullWidth onClick={() => window.open(googleMapsQuery(store.id), '_blank')}>
          Get Directions
        </Button>
      </div>

      <section className="mt-5">
        <h3 className="mb-3 text-lg font-bold text-gray-900">Products at {store.id}</h3>
        <Card className="space-y-2">
          {loading ? (
            <p className="px-2 py-3 text-sm text-gray-500">Loading products...</p>
          ) : products.length ? (
            products.map((product) => (
              <Link key={product.productId} href={`/product/${product.productId}`} className="flex items-center justify-between rounded-xl px-2 py-2 hover:bg-gray-50">
                <span className="text-sm text-gray-900">{product.name}</span>
                <span className="font-semibold text-brand-700">{formatPKR(product.price)}</span>
              </Link>
            ))
          ) : (
            <p className="px-2 py-3 text-sm text-gray-500">No products found.</p>
          )}
        </Card>
        {!loading && products.length < total ? (
          <div className="mt-3">
            <Button variant="secondary" fullWidth onClick={loadMore}>
              Load more
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
