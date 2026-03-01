import { GroceryCategory, Product, Store } from '@/types/product';

export const stores: Store[] = [
  {
    id: 'Al-Fatah',
    accent: '#D32F2F',
    location: 'Main Boulevard, Lahore',
    hours: '9:00 AM - 11:00 PM',
    phone: '+92 42 111 111 111',
    reviews: 120,
    rating: 4.5
  },
  {
    id: 'Carrefour',
    accent: '#1976D2',
    location: 'Packages Mall, Lahore',
    hours: '10:00 AM - 11:00 PM',
    phone: '+92 42 111 222 222',
    reviews: 210,
    rating: 4.4
  },
  {
    id: 'Imtiaz',
    accent: '#388E3C',
    location: 'Johar Town, Lahore',
    hours: '9:00 AM - 12:00 AM',
    phone: '+92 42 111 333 333',
    reviews: 189,
    rating: 4.6
  },
  {
    id: 'Jalal Sons',
    accent: '#F57C00',
    location: 'Gulberg III, Lahore',
    hours: '9:00 AM - 11:00 PM',
    phone: '+92 42 111 444 444',
    reviews: 98,
    rating: 4.3
  },
  {
    id: 'Metro',
    accent: '#00796B',
    location: 'Thokar Niaz Baig, Lahore',
    hours: '8:00 AM - 12:00 AM',
    phone: '+92 42 111 555 555',
    reviews: 137,
    rating: 4.2
  },
  {
    id: 'Rainbow',
    accent: '#7B1FA2',
    location: 'DHA Phase 5, Lahore',
    hours: '10:00 AM - 10:00 PM',
    phone: '+92 42 111 666 666',
    reviews: 73,
    rating: 4.1
  }
];

export const homeCategories = [
  {
    key: 'grocery',
    title: 'Groceries',
    urdu: 'کریانہ',
    image: '/assets/icons/grocery.png',
    bg: '#E8F5E9'
  },
  {
    key: 'pharma',
    title: 'Pharmaceuticals',
    urdu: 'ادویات',
    image: '/assets/icons/pharma.png',
    bg: '#FCE4EC'
  }
];

export const groceryCategories: GroceryCategory[] = [
  { slug: 'atta-flour', name: 'Atta & Flour', urdu: 'آٹا', image: '/assets/images/Flour.jpg' },
  { slug: 'rice', name: 'Rice', urdu: 'چاول', image: '/assets/images/Rice.jpg' },
  { slug: 'cooking-oil', name: 'Cooking Oil', urdu: 'تیل', image: '/assets/images/Cooking Oil.jpg' },
  { slug: 'spices', name: 'Spices', urdu: 'مصالحہ جات', image: '/assets/images/spices.png' },
  { slug: 'pulses-lentils', name: 'Pulses & Lentils', urdu: 'دالیں', image: '/assets/images/Cereals.jpg' },
  { slug: 'sugar-salt', name: 'Sugar & Salt', urdu: 'چینی و نمک', image: '/assets/images/Sugar.jpg' },
  { slug: 'dairy-products', name: 'Dairy Products', urdu: 'دودھ و مکھن', image: '/assets/images/dairy.jpg' },
  { slug: 'bread-biscuits', name: 'Bread & Biscuits', urdu: 'بریڈ و بسکٹ', image: '/assets/images/bakery.png' },
  { slug: 'tea-coffee', name: 'Tea & Coffee', urdu: 'چائے و کافی', image: '/assets/images/Tea.jpg' },
  { slug: 'beverages', name: 'Beverages', urdu: 'مشروبات', image: '/assets/images/beverages.png' },
  { slug: 'snacks', name: 'Snacks', urdu: 'اسنیکس', image: '/assets/images/snacks.png' },
  { slug: 'fruits-vegetables', name: 'Fruits & Vegetables', urdu: 'پھل و سبزیاں', image: '/assets/images/veg.png' },
  { slug: 'meat-poultry', name: 'Meat & Poultry', urdu: 'گوشت', image: '/assets/images/others.png' },
  { slug: 'frozen-foods', name: 'Frozen Foods', urdu: 'منجمد کھانا', image: '/assets/images/frozen.jpg' },
  { slug: 'cleaning-household', name: 'Cleaning & Household', urdu: 'صفائی کا سامان', image: '/assets/images/cleaning.png' },
  { slug: 'baby-products', name: 'Baby Products', urdu: 'بچوں کا سامان', image: '/assets/images/baby.png' },
  { slug: 'personal-care', name: 'Personal Care', urdu: 'ذاتی نگہداشت', image: '/assets/images/personal.png' }
];

export const products: Product[] = [
  {
    productId: 'milk-olpers-imtiaz',
    name: 'Olpers Milk 1L',
    price: 320,
    storeId: 'Imtiaz',
    category: 'dairy-products',
    imageUrl: '/assets/images/milk.png',
    matchedProductIds: ['milk-olpers-metro', 'milk-olpers-carrefour'],
    matchedProductsCount: 2,
    isPharma: false
  },
  {
    productId: 'milk-olpers-metro',
    name: 'Olpers Milk 1L',
    price: 335,
    storeId: 'Metro',
    category: 'dairy-products',
    imageUrl: '/assets/images/milk.png',
    matchedProductIds: ['milk-olpers-imtiaz', 'milk-olpers-carrefour'],
    matchedProductsCount: 2,
    isPharma: false
  },
  {
    productId: 'milk-olpers-carrefour',
    name: 'Olpers Milk 1L',
    price: 325,
    storeId: 'Carrefour',
    category: 'dairy-products',
    imageUrl: '/assets/images/milk.png',
    matchedProductIds: ['milk-olpers-imtiaz', 'milk-olpers-metro'],
    matchedProductsCount: 2,
    isPharma: false
  },
  {
    productId: 'sugar-1kg-alfatah',
    name: 'Fine Sugar 1kg',
    price: 170,
    storeId: 'Al-Fatah',
    category: 'sugar-salt',
    imageUrl: '/assets/images/Sugar.jpg',
    matchedProductIds: ['sugar-1kg-jalalsons', 'sugar-1kg-imtiaz'],
    matchedProductsCount: 2,
    isPharma: false
  },
  {
    productId: 'sugar-1kg-jalalsons',
    name: 'Fine Sugar 1kg',
    price: 162,
    storeId: 'Jalal Sons',
    category: 'sugar-salt',
    imageUrl: '/assets/images/Sugar.jpg',
    matchedProductIds: ['sugar-1kg-alfatah', 'sugar-1kg-imtiaz'],
    matchedProductsCount: 2,
    isPharma: false
  },
  {
    productId: 'sugar-1kg-imtiaz',
    name: 'Fine Sugar 1kg',
    price: 165,
    storeId: 'Imtiaz',
    category: 'sugar-salt',
    imageUrl: '/assets/images/Sugar.jpg',
    matchedProductIds: ['sugar-1kg-alfatah', 'sugar-1kg-jalalsons'],
    matchedProductsCount: 2,
    isPharma: false
  },
  {
    productId: 'basmati-rice-metro',
    name: 'Basmati Rice 1kg',
    price: 420,
    storeId: 'Metro',
    category: 'rice',
    imageUrl: '/assets/images/Rice.jpg',
    matchedProductIds: ['basmati-rice-rainbow', 'basmati-rice-carrefour'],
    matchedProductsCount: 2,
    isPharma: false
  },
  {
    productId: 'basmati-rice-rainbow',
    name: 'Basmati Rice 1kg',
    price: 398,
    storeId: 'Rainbow',
    category: 'rice',
    imageUrl: '/assets/images/Rice.jpg',
    matchedProductIds: ['basmati-rice-metro', 'basmati-rice-carrefour'],
    matchedProductsCount: 2,
    isPharma: false
  },
  {
    productId: 'basmati-rice-carrefour',
    name: 'Basmati Rice 1kg',
    price: 415,
    storeId: 'Carrefour',
    category: 'rice',
    imageUrl: '/assets/images/Rice.jpg',
    matchedProductIds: ['basmati-rice-metro', 'basmati-rice-rainbow'],
    matchedProductsCount: 2,
    isPharma: false
  },
  {
    productId: 'tea-lipton-alfatah',
    name: 'Lipton Yellow Label 475g',
    price: 980,
    storeId: 'Al-Fatah',
    category: 'tea-coffee',
    imageUrl: '/assets/images/Tea.jpg',
    matchedProductIds: ['tea-lipton-imtiaz', 'tea-lipton-jalalsons'],
    matchedProductsCount: 2,
    isPharma: false
  },
  {
    productId: 'tea-lipton-imtiaz',
    name: 'Lipton Yellow Label 475g',
    price: 940,
    storeId: 'Imtiaz',
    category: 'tea-coffee',
    imageUrl: '/assets/images/Tea.jpg',
    matchedProductIds: ['tea-lipton-alfatah', 'tea-lipton-jalalsons'],
    matchedProductsCount: 2,
    isPharma: false
  },
  {
    productId: 'tea-lipton-jalalsons',
    name: 'Lipton Yellow Label 475g',
    price: 965,
    storeId: 'Jalal Sons',
    category: 'tea-coffee',
    imageUrl: '/assets/images/Tea.jpg',
    matchedProductIds: ['tea-lipton-alfatah', 'tea-lipton-imtiaz'],
    matchedProductsCount: 2,
    isPharma: false
  },
  {
    productId: 'panadol-carrefour',
    name: 'Panadol Tablets 20s',
    price: 140,
    storeId: 'Carrefour',
    category: 'pharma',
    imageUrl: '/assets/icons/pharma.png',
    matchedProductIds: ['panadol-imtiaz', 'panadol-metro'],
    matchedProductsCount: 2,
    isPharma: true
  },
  {
    productId: 'panadol-imtiaz',
    name: 'Panadol Tablets 20s',
    price: 135,
    storeId: 'Imtiaz',
    category: 'pharma',
    imageUrl: '/assets/icons/pharma.png',
    matchedProductIds: ['panadol-carrefour', 'panadol-metro'],
    matchedProductsCount: 2,
    isPharma: true
  },
  {
    productId: 'panadol-metro',
    name: 'Panadol Tablets 20s',
    price: 142,
    storeId: 'Metro',
    category: 'pharma',
    imageUrl: '/assets/icons/pharma.png',
    matchedProductIds: ['panadol-carrefour', 'panadol-imtiaz'],
    matchedProductsCount: 2,
    isPharma: true
  },
  {
    productId: 'oil-dalda-rainbow',
    name: 'Dalda Cooking Oil 1L',
    price: 510,
    storeId: 'Rainbow',
    category: 'cooking-oil',
    imageUrl: '/assets/images/Cooking Oil.jpg',
    matchedProductIds: ['oil-dalda-alfatah', 'oil-dalda-carrefour'],
    matchedProductsCount: 2,
    isPharma: false
  },
  {
    productId: 'oil-dalda-alfatah',
    name: 'Dalda Cooking Oil 1L',
    price: 499,
    storeId: 'Al-Fatah',
    category: 'cooking-oil',
    imageUrl: '/assets/images/Cooking Oil.jpg',
    matchedProductIds: ['oil-dalda-rainbow', 'oil-dalda-carrefour'],
    matchedProductsCount: 2,
    isPharma: false
  },
  {
    productId: 'oil-dalda-carrefour',
    name: 'Dalda Cooking Oil 1L',
    price: 505,
    storeId: 'Carrefour',
    category: 'cooking-oil',
    imageUrl: '/assets/images/Cooking Oil.jpg',
    matchedProductIds: ['oil-dalda-rainbow', 'oil-dalda-alfatah'],
    matchedProductsCount: 2,
    isPharma: false
  }
];

export const storeIds = ['All Stores', 'Al-Fatah', 'Carrefour', 'Imtiaz', 'Jalal Sons', 'Metro', 'Rainbow'] as const;
