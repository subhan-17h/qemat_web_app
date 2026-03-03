'use client';

import { Heart, Share2, Store, Trophy } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import Image from 'next/image';

import { AppBar } from '@/components/navigation/AppBar';
import { BottomSheet } from '@/components/shared/BottomSheet';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatPKR, googleMapsQuery } from '@/lib/formatters';
import { useAppStore } from '@/store/app-store';

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams<{ productId: string }>();
  const { products, isFavorited, toggleFavorite } = useAppStore();

  const [promptSignIn, setPromptSignIn] = useState(false);

  const product = products.find((item) => item.productId === params.productId);
  const matches = useMemo(() => {
    if (!product) return [];
    return products.filter((item) => [product.productId, ...product.matchedProductIds].includes(item.productId));
  }, [product, products]);

  if (!product) {
    return (
      <div className="mx-auto w-full max-w-screen-xl px-4">
        <AppBar title="Product Details" showBack sticky />
        <EmptyState
          icon={<Heart className="text-gray-300" size={48} />}
          title="Product not found"
          description="This product may have been removed."
        />
      </div>
    );
  }

  const cheapest = matches.reduce((lowest, current) => (current.price < lowest.price ? current : lowest), matches[0]);
  const comparisonRows = matches.filter((item) => item.productId !== product.productId);

  const handleToggleFavorite = async () => {
    try {
      await toggleFavorite(product.productId);
    } catch {
      setPromptSignIn(true);
    }
  };

  const handleShare = async () => {
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
    <div className="mx-auto w-full max-w-screen-xl px-4 pb-8 lg:px-8">
      <AppBar
        title="Product Details"
        showBack
        sticky
        rightAction={
          <div className="flex items-center gap-1">
            <button aria-label="Share product" onClick={handleShare} className="rounded-full p-2 text-gray-700 hover:bg-gray-100">
              <Share2 size={18} />
            </button>
            <button aria-label="Favorite product" onClick={handleToggleFavorite} className="rounded-full p-2 text-gray-700 hover:bg-gray-100">
              <Heart size={20} className={isFavorited(product.productId) ? 'fill-red-600 text-red-600' : ''} />
            </button>
          </div>
        }
      />

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
          <Image src={product.imageUrl} alt={product.name} fill className="object-contain" />
        </div>
        <div className="mt-3 space-y-1 px-1">
          <h2 className="text-center text-lg font-bold text-gray-900">{product.name}</h2>
          <p className="text-center text-lg font-medium text-gray-900">{formatPKR(product.price)}</p>
        </div>
      </Card>

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
                    <Image src={item.imageUrl} alt={item.name} fill className="object-contain" />
                  </div>
                  <span className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.storeId}</p>
                  </span>
                  <span className="text-right">
                    <p className="text-base font-bold text-gray-900">{formatPKR(item.price)}</p>
                    {item.productId === cheapest.productId ? (
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

      <BottomSheet
        open={promptSignIn}
        onClose={() => setPromptSignIn(false)}
        title="Sign In Required"
        description="Please sign in to add products to your favorites."
        confirmLabel="Sign In"
        onConfirm={() => router.push('/sign-in')}
      />
    </div>
  );
}
