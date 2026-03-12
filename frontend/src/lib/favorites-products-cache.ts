import { Product } from '@/types/product';

export const FAVORITES_PRODUCTS_CACHE_TTL_MS = 5 * 60 * 1000;

export interface FavoritesProductsCacheEntry {
  token: string;
  products: Product[];
  cachedAt: number;
}

let favoritesProductsCache: FavoritesProductsCacheEntry | null = null;

export function readFavoritesProductsCache(token: string): FavoritesProductsCacheEntry | null {
  if (!favoritesProductsCache || favoritesProductsCache.token !== token) return null;
  return {
    ...favoritesProductsCache,
    products: [...favoritesProductsCache.products]
  };
}

export function writeFavoritesProductsCache(token: string, products: Product[]) {
  favoritesProductsCache = {
    token,
    products: [...products],
    cachedAt: Date.now()
  };
}

export function patchFavoritesProductsCache(token: string, updater: (products: Product[]) => Product[]) {
  if (!favoritesProductsCache || favoritesProductsCache.token !== token) return;
  favoritesProductsCache = {
    token,
    products: updater([...favoritesProductsCache.products]),
    cachedAt: Date.now()
  };
}

export function clearFavoritesProductsCache(token?: string) {
  if (!favoritesProductsCache) return;
  if (token && favoritesProductsCache.token !== token) return;
  favoritesProductsCache = null;
}

export function isFavoritesProductsCacheFresh(entry: FavoritesProductsCacheEntry, now = Date.now()) {
  return now - entry.cachedAt < FAVORITES_PRODUCTS_CACHE_TTL_MS;
}
