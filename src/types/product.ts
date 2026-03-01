export type StoreId = 'Al-Fatah' | 'Carrefour' | 'Imtiaz' | 'Jalal Sons' | 'Metro' | 'Rainbow';

export interface Product {
  productId: string;
  name: string;
  price: number;
  storeId: StoreId;
  category: string;
  imageUrl: string;
  matchedProductIds: string[];
  matchedProductsCount: number;
  isPharma: boolean;
}

export interface GroceryCategory {
  slug: string;
  name: string;
  urdu: string;
  transliteration?: string;
  image: string;
}

export interface Store {
  id: StoreId;
  accent: string;
  location: string;
  hours: string;
  phone: string;
  reviews: number;
  rating: number;
}
