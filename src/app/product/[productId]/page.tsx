'use client';

import { Heart, Share2, Trophy } from 'lucide-react';
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
          <button aria-label="Favorite product" onClick={handleToggleFavorite} className="rounded-full p-2 text-gray-700 hover:bg-gray-100">
            <Heart size={20} className={isFavorited(product.productId) ? 'fill-red-600 text-red-600' : ''} />
          </button>
        }
      />

      <Card className="mt-4 overflow-hidden p-0">
        <div className="relative h-56 w-full bg-white">
          <Image src={product.imageUrl} alt={product.name} fill className="object-contain" />
        </div>
        <div className="space-y-2 p-4">
          <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
          <p className="text-2xl font-extrabold text-brand-700">{formatPKR(product.price)}</p>
          <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">{product.storeId}</span>
        </div>
      </Card>

      <Card className="mt-4 border border-green-100 bg-green-50">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-green-100 text-brand-700">
            <Trophy size={16} />
          </span>
          <p className="font-semibold text-gray-900">Best Price Available</p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-lg font-bold text-gray-900">{cheapest.storeId}</p>
          <p className="text-3xl font-extrabold text-brand-700">{formatPKR(cheapest.price)}</p>
          <span className="mt-1 inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-brand-700">Cheapest option</span>
          <div className="mt-3">
            <Button onClick={() => window.open(googleMapsQuery(cheapest.storeId), '_blank')}>Find Store on Map</Button>
          </div>
        </div>
      </Card>

      {comparisonRows.length ? (
        <section className="mt-5">
          <h3 className="mb-3 text-lg font-bold text-gray-900">Compare Prices</h3>
          <Card className="p-0">
            {matches.map((item) => (
              <button
                key={item.productId}
                className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-gray-50"
                onClick={() => window.open(googleMapsQuery(item.storeId), '_blank')}
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-green-100 text-brand-700">{item.storeId.slice(0, 1)}</span>
                <span className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{item.storeId}</p>
                  <p className="text-xs text-gray-500">{item.name}</p>
                </span>
                <span className="text-right">
                  <p className="text-base font-bold text-gray-900">{formatPKR(item.price)}</p>
                  {item.productId === cheapest.productId ? (
                    <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-brand-700">Best ✓</span>
                  ) : null}
                </span>
              </button>
            ))}
          </Card>
        </section>
      ) : null}

      <div className="sticky bottom-16 mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-white/95 p-2 backdrop-blur lg:static lg:bg-transparent lg:p-0">
        <Button variant="secondary" onClick={() => router.push(`/add-price?productId=${product.productId}`)}>
          Update Price
        </Button>
        <Button variant="ghost" onClick={handleShare}>
          <Share2 size={16} />
          Share Product
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
