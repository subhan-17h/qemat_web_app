'use client';

import { Camera, MapPin, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { AppBar } from '@/components/navigation/AppBar';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { Input } from '@/components/shared/Input';
import { storeIds } from '@/lib/mock-data';
import { fetchProductById, searchProductsPage } from '@/lib/api';
import { useAppStore } from '@/store/app-store';
import { Product } from '@/types/product';

export default function AddPricePage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAppStore();

  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [store, setStore] = useState<string>('Al-Fatah');
  const [location, setLocation] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);

  useEffect(() => {
    if (!user) {
      router.replace('/sign-in');
    }
  }, [user, router]);

  useEffect(() => {
    let active = true;
    const productId = params.get('productId');
    if (!productId) return;

    const load = async () => {
      try {
        const product = await fetchProductById(productId);
        if (active) setProductName(product.name);
      } catch {
        if (active) setProductName('');
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [params]);

  useEffect(() => {
    let active = true;
    if (!productName.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await searchProductsPage({
          type: 'grocery',
          query: productName.trim(),
          limit: 5,
          offset: 0
        });
        if (active) setSuggestions(response.products);
      } catch {
        if (active) setSuggestions([]);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [productName]);

  if (!user) {
    return null;
  }

  const productSuggestions = suggestions;

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocation('Location unavailable in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(`${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`);
      },
      () => setLocation('Unable to fetch your location.')
    );
  };

  const submit = async () => {
    if (!productName || !price || Number(price) <= 0) {
      alert('Please add a product and a valid positive price.');
      return;
    }

    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSubmitting(false);
    alert('Price submitted successfully! +50 points');
    router.back();
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-8 lg:px-10 xl:px-12">
      <AppBar title="Add/Update Price" showBack sticky />

      <div className="mt-4 space-y-4">
        <Card className="space-y-3">
          <Input
            label="Product"
            placeholder="Search or type product name..."
            value={productName}
            onChange={(event) => setProductName(event.target.value)}
            endSlot={<Search size={16} />}
          />
          {productSuggestions.length ? (
            <div className="space-y-1 rounded-xl border border-gray-200 p-2">
              {productSuggestions.map((suggestion) => (
                <button
                  key={suggestion.productId}
                  onClick={() => setProductName(suggestion.name)}
                  className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-gray-50"
                >
                  {suggestion.name}
                </button>
              ))}
            </div>
          ) : null}

          <Input
            label="Price (Rs.)"
            type="number"
            placeholder="Enter price"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            startSlot="Rs."
          />

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-gray-700">Store</span>
            <select
              value={store}
              onChange={(event) => setStore(event.target.value)}
              className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-sm"
            >
              {storeIds
                .filter((item) => item !== 'All Stores')
                .map((item) => (
                  <option key={item}>{item}</option>
                ))}
            </select>
          </label>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Product Photo</p>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 p-5 text-gray-600">
              <Camera size={20} />
              <span className="text-sm">Tap to add photo</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setPhoto(URL.createObjectURL(file));
                }}
              />
            </label>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Product upload preview" className="mt-2 h-28 w-28 rounded-xl object-cover" />
            ) : null}
          </div>

          <Input label="Store Location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Enter location" />
          <Button variant="ghost" size="sm" onClick={useCurrentLocation}>
            <MapPin size={16} />
            Use Current Location
          </Button>

          <Button fullWidth size="lg" loading={submitting} onClick={submit}>
            Submit Price
          </Button>
        </Card>

        <Card className="bg-amber-50 text-sm text-amber-900">
          <p>💡 Earn 50 points for every verified price contribution. Points unlock exclusive rewards (coming soon).</p>
        </Card>
      </div>
    </div>
  );
}
