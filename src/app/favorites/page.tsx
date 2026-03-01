'use client';

import { Heart, HeartOff, Lock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AppBar } from '@/components/navigation/AppBar';
import { BottomSheet } from '@/components/shared/BottomSheet';
import { Button } from '@/components/shared/Button';
import { EmptyState } from '@/components/shared/EmptyState';
import { ProductCard } from '@/components/shared/ProductCard';
import { useAppStore } from '@/store/app-store';

export default function FavoritesPage() {
  const router = useRouter();
  const { user, favorites, products, removeFavorite, isFavorited, toggleFavorite } = useAppStore();

  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const favoriteProducts = useMemo(
    () => products.filter((item) => favorites.includes(item.productId)),
    [products, favorites]
  );

  const handleToggleFavorite = async (productId: string) => {
    await toggleFavorite(productId);
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    await removeFavorite(removeTarget);
    setRemoveTarget(null);
  };

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 pb-8 lg:px-8">
      <AppBar title="Favorites" />

      {!user ? (
        <EmptyState
          icon={<Lock className="text-gray-300" size={48} />}
          title="Sign in to see your favorites"
          description="Create a free account to save and track your favourite products"
          action={<Button onClick={() => router.push('/sign-in')}>Sign In</Button>}
        />
      ) : favoriteProducts.length === 0 ? (
        <EmptyState
          icon={<HeartOff className="text-gray-300" size={48} />}
          title="No favorites yet"
          description="Browse products and tap the heart icon to save them here"
          action={<Button onClick={() => router.push('/search')}>Browse Products</Button>}
        />
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {favoriteProducts.map((product) => (
            <div key={product.productId} className="relative">
              <button
                aria-label="Remove from favorites"
                onClick={() => setRemoveTarget(product.productId)}
                className="absolute right-3 top-3 z-10 rounded-full bg-white p-2 text-red-600 shadow"
              >
                <Heart size={16} className="fill-current" />
              </button>
              <ProductCard
                product={product}
                showFavorite
                favorited={isFavorited(product.productId)}
                onFavoriteToggle={() => handleToggleFavorite(product.productId)}
              />
            </div>
          ))}
        </div>
      )}

      <BottomSheet
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        title="Remove from Favorites"
        description="Are you sure you want to remove this product from your favorites?"
        confirmLabel="Remove"
        onConfirm={handleRemove}
        destructive
      />
    </div>
  );
}
