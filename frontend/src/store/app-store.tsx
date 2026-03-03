'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { fetchFavorites, signInWithBackend, signUpWithBackend, toggleFavoriteOnBackend } from '@/lib/api';
import { User } from '@/types/user';

interface AppStoreValue {
  user: User | null;
  favorites: string[];
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  toggleFavorite: (productId: string) => Promise<void>;
  removeFavorite: (productId: string) => Promise<void>;
  isFavorited: (productId: string) => boolean;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const userRaw = localStorage.getItem('qemat-user');

    if (userRaw) {
      setUser(JSON.parse(userRaw) as User);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const loadFavorites = async () => {
      if (!user?.token) {
        setFavorites([]);
        return;
      }

      try {
        const favoriteIds = await fetchFavorites(user.token);
        if (active) {
          setFavorites(favoriteIds);
        }
      } catch (error) {
        console.error('Failed to load favorites from backend.', error);
      }
    };

    void loadFavorites();
    return () => {
      active = false;
    };
  }, [user]);

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

  const signIn = useCallback(async (email: string, password: string) => {
    const nextUser = await signInWithBackend(email, password);
    setUser(nextUser);

    try {
      const favoriteIds = await fetchFavorites(nextUser.token);
      setFavorites(favoriteIds);
    } catch (error) {
      console.error('Failed to sync favorites after sign-in.', error);
      setFavorites([]);
    }
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const nextUser = await signUpWithBackend(name, email, password);
    setUser(nextUser);
    setFavorites([]);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setFavorites([]);
  }, []);

  const toggleFavorite = useCallback(
    async (productId: string) => {
      if (!user?.token) {
        throw new Error('AUTH_REQUIRED');
      }

      const wasFavorited = favorites.includes(productId);
      setFavorites((current) => {
        if (wasFavorited) {
          return current.filter((id) => id !== productId);
        }

        return [...new Set([...current, productId])];
      });

      try {
        await toggleFavoriteOnBackend(user.token, productId);
      } catch (error) {
        setFavorites((current) => {
          if (wasFavorited) {
            return [...new Set([...current, productId])];
          }

          return current.filter((id) => id !== productId);
        });
        throw error;
      }
    },
    [favorites, user]
  );

  const removeFavorite = useCallback(
    async (productId: string) => {
      if (!favorites.includes(productId)) {
        return;
      }
      await toggleFavorite(productId);
    },
    [favorites, toggleFavorite]
  );

  const isFavorited = useCallback(
    (productId: string) => favorites.includes(productId),
    [favorites]
  );

  const value = useMemo(
    () => ({
      user,
      favorites,
      signIn,
      signUp,
      signOut,
      toggleFavorite,
      removeFavorite,
      isFavorited
    }),
    [favorites, isFavorited, removeFavorite, signIn, signOut, signUp, toggleFavorite, user]
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
