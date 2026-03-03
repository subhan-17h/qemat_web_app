'use client';

import Link from 'next/link';
import { Clock3, MapPin, Phone, Share2, Star } from 'lucide-react';
import { useParams } from 'next/navigation';

import { AppBar } from '@/components/navigation/AppBar';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatPKR, googleMapsQuery } from '@/lib/formatters';
import { stores } from '@/lib/mock-data';
import { useAppStore } from '@/store/app-store';

export default function StoreProfilePage() {
  const params = useParams<{ storeId: string }>();
  const { products } = useAppStore();

  const store = stores.find((item) => item.id === decodeURIComponent(params.storeId));

  if (!store) {
    return (
      <div className="mx-auto w-full max-w-screen-xl px-4">
        <AppBar title="Store Profile" showBack sticky />
        <EmptyState icon={<MapPin className="text-gray-300" size={48} />} title="Store not found" description="Store details are unavailable." />
      </div>
    );
  }

  const storeProducts = products.filter((item) => item.storeId === store.id);

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 pb-8 lg:px-8">
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
          {storeProducts.map((product) => (
            <Link key={product.productId} href={`/product/${product.productId}`} className="flex items-center justify-between rounded-xl px-2 py-2 hover:bg-gray-50">
              <span className="text-sm text-gray-900">{product.name}</span>
              <span className="font-semibold text-brand-700">{formatPKR(product.price)}</span>
            </Link>
          ))}
        </Card>
      </section>
    </div>
  );
}
