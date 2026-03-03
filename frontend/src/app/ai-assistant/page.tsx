'use client';

import { AlertCircle, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { AppBar } from '@/components/navigation/AppBar';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatPKR } from '@/lib/formatters';
import { useAppStore } from '@/store/app-store';

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

export default function AIAssistantPage() {
  const { user, favorites, products } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [rows, setRows] = useState<SavingRow[] | null>(null);

  const favoriteProducts = useMemo(
    () => products.filter((item) => favorites.includes(item.productId)),
    [products, favorites]
  );

  const totalSavings = useMemo(() => rows?.reduce((sum, row) => sum + row.maxSavedAmount, 0) ?? 0, [rows]);

  const runAssistant = async () => {
    setError(false);
    setLoading(true);
    setRows(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const nextRows: SavingRow[] = favoriteProducts.map((product) => {
        const related = products.filter((item) => [product.productId, ...product.matchedProductIds].includes(item.productId));
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
    } catch {
      setError(true);
    } finally {
      setLoading(false);
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
      ) : rows === null ? (
        <div className="mx-auto mt-12 flex max-w-xl flex-col items-center gap-5 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-green-100 text-brand-700">
            <ShoppingBag size={36} />
          </span>
          <Card className="w-full">
            <p className="text-base leading-relaxed text-gray-700">
              Hi! I&apos;m your shopping assistant. Tap below to fetch your shopping list and I&apos;ll help you calculate how much
              you can save today!
            </p>
          </Card>
          <Button loading={loading} size="lg" onClick={runAssistant} fullWidth>
            Get My Shopping List
          </Button>
        </div>
      ) : error ? (
        <EmptyState
          icon={<AlertCircle className="text-gray-300" size={48} />}
          title="Something went wrong"
          description="Failed to load your shopping list. Please try again."
          action={<Button onClick={runAssistant}>Retry</Button>}
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
          <Card className="sticky top-3 z-20 border border-green-200 bg-green-50">
            <p className="text-sm font-semibold text-gray-700">Your Shopping List · {rows.length} items</p>
            <p className="mt-1 text-xl font-bold text-brand-700">You could save up to {formatPKR(totalSavings)} today!</p>
          </Card>

          {rows.map((row) => (
            <Card key={row.productId} className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-lg bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={row.imageUrl} alt={row.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{row.name}</p>
                <p className="text-xs text-gray-600">
                  {formatPKR(row.price)} at {row.storeName}
                </p>
                {row.isCheapest ? (
                  <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-[11px] font-semibold text-brand-700">Best price ✓</span>
                ) : (
                  <p className="text-xs font-medium text-amber-700">
                    Save {formatPKR(row.minSavedAmount)} - {formatPKR(row.maxSavedAmount)} at {row.cheaperStore}{' '}
                    <Link href={`/product/${row.productId}`} className="underline">
                      View
                    </Link>
                  </p>
                )}
              </div>
            </Card>
          ))}

          <Button variant="secondary" onClick={() => setRows(null)}>
            Back to assistant
          </Button>
        </div>
      )}
    </div>
  );
}
