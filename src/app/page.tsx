'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Search } from 'lucide-react';

import { AppBar } from '@/components/navigation/AppBar';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { ProductCard } from '@/components/shared/ProductCard';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { homeCategories } from '@/lib/mock-data';
import { useAppStore } from '@/store/app-store';

export default function HomePage() {
  const { products, loadingProducts } = useAppStore();
  const trending = [...products].sort((a, b) => b.matchedProductsCount - a.matchedProductsCount).slice(0, 8);

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 pb-8 lg:px-8">
      <AppBar title="Qemat" />

      <div className="mt-4 space-y-6">
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

        <section>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {homeCategories.map((category) => {
              const href = category.key === 'grocery' ? '/search/categories' : '/search?pharma=true';

              return (
                <Link key={category.key} href={href} className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: category.bg }}>
                  <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-white/80">
                    <Image src={category.image} alt={category.title} width={30} height={30} />
                  </div>
                  <p className="text-center text-sm font-semibold text-gray-900">{category.title}</p>
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

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Most Popular</h2>
            <Link href="/search">
              <Button size="sm" variant="secondary">
                View All
              </Button>
            </Link>
          </div>

          {loadingProducts ? (
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
                    className="min-w-[165px] border-gray-200/70 shadow-none"
                  />
                ))}
              </div>

              <div className="hidden overflow-hidden lg:block">
                <div className="grid grid-cols-4 gap-4">
                  {trending.map((product) => (
                    <ProductCard
                      key={product.productId}
                      product={product}
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
