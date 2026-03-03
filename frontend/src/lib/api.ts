import { Product, StoreId } from '@/types/product';
import { User } from '@/types/user';

type ProductType = 'grocery' | 'pharma';

interface ProductBundleResponse {
  products: Record<string, unknown>[];
}

interface AuthUserResponse {
  uid: string;
  email: string;
  username?: string | null;
  displayName?: string | null;
  display_name?: string | null;
  photoURL?: string | null;
  photo_url?: string | null;
}

interface AuthResponse {
  user: AuthUserResponse;
  token: string;
}

interface FavoritesResponse {
  favoriteIds: string[];
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000').replace(/\/+$/, '');

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    return value;
  }
  return fallback;
}

function getNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function getBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  return fallback;
}

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === 'string');
}

function normalizeProduct(raw: Record<string, unknown>, defaultIsPharma = false): Product {
  const productId = getString(raw.productId ?? raw.product_id);
  const matchedProductIds = getStringArray(raw.matchedProductIds ?? raw.matched_product_ids ?? raw.matched_products);
  const matchedProductsCount = getNumber(raw.matchedProductsCount ?? raw.matched_products_count, matchedProductIds.length);

  return {
    productId,
    name: getString(raw.name ?? raw.product_name),
    price: getNumber(raw.price),
    storeId: getString(raw.storeId ?? raw.store_id) as StoreId,
    category: getString(raw.category),
    imageUrl: getString(raw.imageUrl ?? raw.image_url),
    matchedProductIds,
    matchedProductsCount,
    isPharma: getBoolean(raw.isPharma ?? raw.is_pharma, defaultIsPharma)
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload.detail) {
        message = payload.detail;
      }
    } catch {
      message = response.statusText || message;
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

async function fetchProductsByType(type: ProductType): Promise<Product[]> {
  const query = new URLSearchParams({ type });
  const response = await request<ProductBundleResponse>(`/api/products/bundle?${query.toString()}`);
  return (response.products ?? []).map((item) => normalizeProduct(item, type === 'pharma'));
}

function buildUser(authUser: AuthUserResponse, token: string, fallbackName?: string): User {
  const displayName = authUser.displayName ?? authUser.display_name ?? null;
  const name = displayName || authUser.username || fallbackName || authUser.email.split('@')[0] || 'Qemat User';

  return {
    uid: authUser.uid,
    email: authUser.email,
    name,
    username: authUser.username ?? undefined,
    displayName: displayName ?? undefined,
    photoURL: authUser.photoURL ?? authUser.photo_url ?? undefined,
    token
  };
}

export async function fetchAllProducts(): Promise<Product[]> {
  const [grocery, pharma] = await Promise.all([
    fetchProductsByType('grocery'),
    fetchProductsByType('pharma')
  ]);

  const deduped = new Map<string, Product>();
  [...grocery, ...pharma].forEach((product) => {
    if (!deduped.has(product.productId)) {
      deduped.set(product.productId, product);
    }
  });
  return Array.from(deduped.values());
}

export async function signInWithBackend(email: string, password: string): Promise<User> {
  const response = await request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  return buildUser(response.user, response.token);
}

export async function signUpWithBackend(name: string, email: string, password: string): Promise<User> {
  const response = await request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  return buildUser(response.user, response.token, name);
}

export async function fetchFavorites(token: string): Promise<string[]> {
  const response = await request<FavoritesResponse>('/api/favorites', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.favoriteIds ?? [];
}

export async function toggleFavoriteOnBackend(token: string, productId: string): Promise<void> {
  await request<{ added: boolean; productId: string }>(`/api/favorites/${encodeURIComponent(productId)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}
