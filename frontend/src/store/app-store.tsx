'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { fetchFavorites, signInWithBackend, signInWithGoogleToken, signUpWithBackend, toggleFavoriteOnBackend } from '@/lib/api';
import { getGoogleIdTokenForBackend } from '@/lib/firebase-client';
import { clearFavoritesProductsCache, patchFavoritesProductsCache } from '@/lib/favorites-products-cache';
import { Product } from '@/types/product';
import { User } from '@/types/user';

interface AppStoreValue {
  user: User | null;
  favorites: string[];
  favoritesLoaded: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  toggleFavorite: (productId: string, productSnapshot?: Product) => Promise<void>;
  removeFavorite: (productId: string) => Promise<void>;
  isFavorited: (productId: string) => boolean;
  isFavoriteSyncing: (productId: string) => boolean;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [favoriteSyncingIds, setFavoriteSyncingIds] = useState<string[]>([]);
  const favoritesRef = useRef<string[]>([]);
  const favoriteMutationVersionRef = useRef(new Map<string, number>());
  const favoriteSyncCountRef = useRef(new Map<string, number>());

  const beginFavoriteSync = useCallback((productId: string) => {
    const current = favoriteSyncCountRef.current.get(productId) ?? 0;
    favoriteSyncCountRef.current.set(productId, current + 1);
    if (current === 0) {
      setFavoriteSyncingIds((ids) => (ids.includes(productId) ? ids : [...ids, productId]));
    }
  }, []);

  const endFavoriteSync = useCallback((productId: string) => {
    const current = favoriteSyncCountRef.current.get(productId) ?? 0;
    if (current <= 1) {
      favoriteSyncCountRef.current.delete(productId);
      setFavoriteSyncingIds((ids) => ids.filter((id) => id !== productId));
      return;
    }
    favoriteSyncCountRef.current.set(productId, current - 1);
  }, []);

  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);

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
        setFavoritesLoaded(true);
        return;
      }

      setFavoritesLoaded(false);
      try {
        const favoriteIds = await fetchFavorites(user.token);
        if (active) {
          setFavorites(favoriteIds);
          patchFavoritesProductsCache(user.token, (products) => products.filter((item) => favoriteIds.includes(item.productId)));
        }
      } catch (error) {
        console.error('Failed to load favorites from backend.', error);
        if (active) {
          setFavorites([]);
        }
      } finally {
        if (active) {
          setFavoritesLoaded(true);
        }
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
    setFavoritesLoaded(false);

    try {
      const favoriteIds = await fetchFavorites(nextUser.token);
      setFavorites(favoriteIds);
      patchFavoritesProductsCache(nextUser.token, (products) => products.filter((item) => favoriteIds.includes(item.productId)));
    } catch (error) {
      console.error('Failed to sync favorites after sign-in.', error);
      setFavorites([]);
    } finally {
      setFavoritesLoaded(true);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const idToken = await getGoogleIdTokenForBackend();
    const nextUser = await signInWithGoogleToken(idToken);
    setUser(nextUser);
    setFavoritesLoaded(false);

    try {
      const favoriteIds = await fetchFavorites(nextUser.token);
      setFavorites(favoriteIds);
      patchFavoritesProductsCache(nextUser.token, (products) => products.filter((item) => favoriteIds.includes(item.productId)));
    } catch (error) {
      console.error('Failed to sync favorites after Google sign-in.', error);
      setFavorites([]);
    } finally {
      setFavoritesLoaded(true);
    }
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const nextUser = await signUpWithBackend(name, email, password);
    setUser(nextUser);
    setFavorites([]);
    setFavoritesLoaded(true);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setFavorites([]);
    setFavoritesLoaded(true);
    setFavoriteSyncingIds([]);
    favoriteSyncCountRef.current.clear();
    clearFavoritesProductsCache();
  }, []);

  const toggleFavorite = useCallback(
    async (productId: string, productSnapshot?: Product) => {
      if (!user?.token) {
        throw new Error('AUTH_REQUIRED');
      }

      const token = user.token;
      const currentlyFavorited = favoritesRef.current.includes(productId);
      const shouldBeFavorited = !currentlyFavorited;
      const nextVersion = (favoriteMutationVersionRef.current.get(productId) ?? 0) + 1;
      favoriteMutationVersionRef.current.set(productId, nextVersion);

      setFavorites((current) => {
        if (shouldBeFavorited) {
          return current.includes(productId) ? current : [...current, productId];
        }
        return current.filter((id) => id !== productId);
      });

      if (shouldBeFavorited) {
        if (productSnapshot) {
          patchFavoritesProductsCache(token, (products) => {
            const withoutCurrent = products.filter((item) => item.productId !== productId);
            return [productSnapshot, ...withoutCurrent];
          });
        }
      } else {
        patchFavoritesProductsCache(token, (products) => products.filter((item) => item.productId !== productId));
      }

      beginFavoriteSync(productId);
      void (async () => {
        try {
          let response = await toggleFavoriteOnBackend(token, productId);
          if (favoriteMutationVersionRef.current.get(productId) !== nextVersion) return;

          if (response.added !== shouldBeFavorited) {
            response = await toggleFavoriteOnBackend(token, productId);
            if (favoriteMutationVersionRef.current.get(productId) !== nextVersion) return;
          }

          if (response.added !== shouldBeFavorited) {
            const serverFavorites = await fetchFavorites(token);
            if (favoriteMutationVersionRef.current.get(productId) !== nextVersion) return;
            setFavorites(serverFavorites);
            patchFavoritesProductsCache(token, (products) => products.filter((item) => serverFavorites.includes(item.productId)));
          }
        } catch (error) {
          if (favoriteMutationVersionRef.current.get(productId) !== nextVersion) return;
          console.error('Failed to sync favorite mutation.', error);

          // Roll back optimistic change when backend update fails.
          setFavorites((current) => {
            if (shouldBeFavorited) {
              return current.filter((id) => id !== productId);
            }
            return current.includes(productId) ? current : [...current, productId];
          });

          if (shouldBeFavorited) {
            patchFavoritesProductsCache(token, (products) => products.filter((item) => item.productId !== productId));
          } else if (productSnapshot) {
            patchFavoritesProductsCache(token, (products) => {
              const withoutCurrent = products.filter((item) => item.productId !== productId);
              return [productSnapshot, ...withoutCurrent];
            });
          }
        } finally {
          endFavoriteSync(productId);
        }
      })();
    },
    [beginFavoriteSync, endFavoriteSync, user]
  );

  const removeFavorite = useCallback(
    async (productId: string) => {
      if (!user?.token) {
        throw new Error('AUTH_REQUIRED');
      }

      const token = user.token;
      if (!favoritesRef.current.includes(productId)) {
        patchFavoritesProductsCache(token, (products) => products.filter((item) => item.productId !== productId));
        return;
      }

      const nextVersion = (favoriteMutationVersionRef.current.get(productId) ?? 0) + 1;
      favoriteMutationVersionRef.current.set(productId, nextVersion);
      setFavorites((current) => current.filter((id) => id !== productId));
      patchFavoritesProductsCache(token, (products) => products.filter((item) => item.productId !== productId));

      beginFavoriteSync(productId);
      void (async () => {
        try {
          let response = await toggleFavoriteOnBackend(token, productId);
          if (favoriteMutationVersionRef.current.get(productId) !== nextVersion) return;

          if (response.added !== false) {
            response = await toggleFavoriteOnBackend(token, productId);
            if (favoriteMutationVersionRef.current.get(productId) !== nextVersion) return;
          }

          if (response.added !== false) {
            const serverFavorites = await fetchFavorites(token);
            if (favoriteMutationVersionRef.current.get(productId) !== nextVersion) return;
            setFavorites(serverFavorites);
            patchFavoritesProductsCache(token, (products) => products.filter((item) => serverFavorites.includes(item.productId)));
          }
        } catch (error) {
          if (favoriteMutationVersionRef.current.get(productId) !== nextVersion) return;
          console.error('Failed to sync favorite removal.', error);
          setFavorites((current) => (current.includes(productId) ? current : [...current, productId]));
        } finally {
          endFavoriteSync(productId);
        }
      })();
    },
    [beginFavoriteSync, endFavoriteSync, user]
  );

  const isFavorited = useCallback(
    (productId: string) => favorites.includes(productId),
    [favorites]
  );

  const isFavoriteSyncing = useCallback(
    (productId: string) => favoriteSyncingIds.includes(productId),
    [favoriteSyncingIds]
  );

  const value = useMemo(
    () => ({
      user,
      favorites,
      favoritesLoaded,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
      toggleFavorite,
      removeFavorite,
      isFavorited,
      isFavoriteSyncing
    }),
    [
      favorites,
      favoritesLoaded,
      isFavorited,
      isFavoriteSyncing,
      removeFavorite,
      signIn,
      signInWithGoogle,
      signOut,
      signUp,
      toggleFavorite,
      user
    ]
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
