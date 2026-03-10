'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { AppBar } from '@/components/navigation/AppBar';
import { Card } from '@/components/shared/Card';
import { ProductCard } from '@/components/shared/ProductCard';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { homeCategories } from '@/lib/mock-data';
import { fetchTrendingProducts } from '@/lib/api';
import { Product } from '@/types/product';

export default function HomePage() {
  const [trending, setTrending] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadTrending = async () => {
      try {
        const data = await fetchTrendingProducts();
        if (active) setTrending(data);
      } catch (error) {
        console.error('Failed to load trending products.', error);
        if (active) setTrending([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadTrending();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto h-full w-full max-w-screen-xl overflow-hidden px-4 pb-2 lg:px-8">
      <AppBar title="Qemat" />

      <div className="mt-4 space-y-5">
        <Link href="/search?browse=true">
          <Card className="flex cursor-pointer items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-green-100 text-brand-700">
              <Search size={20} />
            </span>
            <div className="flex-1">
              <p className="text-lg font-bold text-gray-900">Start Browsing</p>
              <p className="text-xs text-gray-500 md:text-sm">Search for products and compare prices</p>
            </div>
            <ChevronRight className="text-gray-400" size={18} />
          </Card>
        </Link>

        <section className="pt-1">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {homeCategories.map((category) => {
              const href = category.key === 'grocery' ? '/search/categories' : '/search?pharma=true';

              return (
                <Link
                  key={category.key}
                  href={href}
                  className="min-h-[132px] rounded-2xl p-4 shadow-sm"
                  style={{ backgroundColor: category.bg }}
                >
                  <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-white/80">
                    <Image src={category.image} alt={category.title} width={28} height={28} />
                  </div>
                  <p className="text-center text-[15px] font-semibold text-gray-900">{category.title}</p>
                  <p className="text-center text-xs text-gray-500">
                    <span dir="rtl" className="font-urdu">
                      {category.urdu}
                    </span>
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="space-y-4 pt-1">
          <div className="flex items-center">
            <h2 className="text-lg font-bold text-gray-900">Most Popular</h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : (
            <>
              <div className="no-scrollbar flex gap-4 overflow-x-auto lg:hidden">
                {trending.map((product) => (
                  <ProductCard
                    key={product.productId}
                    product={product}
                    compact
                    homePopular
                    className="min-w-[148px] border-gray-200/70 shadow-none"
                  />
                ))}
              </div>

              <div className="hidden overflow-hidden lg:block">
                <div className="grid grid-cols-4 gap-4">
                  {trending.map((product) => (
                    <ProductCard
                      key={product.productId}
                      product={product}
                      compact
                      homePopular
                      className="border-gray-200/70 shadow-none"
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
