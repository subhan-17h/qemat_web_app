'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { products } from '@/lib/mock-data';
import { Product } from '@/types/product';
import { User } from '@/types/user';

interface AppStoreValue {
  products: Product[];
  loadingProducts: boolean;
  user: User | null;
  favorites: string[];
  signIn: (name: string, email: string) => void;
  signOut: () => void;
  toggleFavorite: (productId: string) => Promise<void>;
  removeFavorite: (productId: string) => Promise<void>;
  isFavorited: (productId: string) => boolean;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const userRaw = localStorage.getItem('qemat-user');
    const favoritesRaw = localStorage.getItem('qemat-favorites');

    if (userRaw) {
      setUser(JSON.parse(userRaw) as User);
    }

    if (favoritesRaw) {
      setFavorites(JSON.parse(favoritesRaw) as string[]);
    }

    const timer = setTimeout(() => {
      setLoadingProducts(false);
    }, 650);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('qemat-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('qemat-user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('qemat-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const signIn = useCallback((name: string, email: string) => {
    const next: User = {
      uid: crypto.randomUUID(),
      name,
      email
    };

    setUser(next);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setFavorites([]);
  }, []);

  const toggleFavorite = useCallback(
    async (productId: string) => {
      if (!user) {
        throw new Error('AUTH_REQUIRED');
      }

      setFavorites((current) => {
        if (current.includes(productId)) {
          return current.filter((id) => id !== productId);
        }

        return [...current, productId];
      });

      await new Promise((resolve) => setTimeout(resolve, 250));
    },
    [user]
  );

  const removeFavorite = useCallback(async (productId: string) => {
    setFavorites((current) => current.filter((id) => id !== productId));
    await new Promise((resolve) => setTimeout(resolve, 250));
  }, []);

  const isFavorited = useCallback(
    (productId: string) => favorites.includes(productId),
    [favorites]
  );

  const value = useMemo(
    () => ({
      products,
      loadingProducts,
      user,
      favorites,
      signIn,
      signOut,
      toggleFavorite,
      removeFavorite,
      isFavorited
    }),
    [favorites, isFavorited, loadingProducts, removeFavorite, signIn, signOut, toggleFavorite, user]
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useAppStore must be used inside AppStoreProvider');
  }

  return context;
}
