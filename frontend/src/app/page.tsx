'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { AppBar } from '@/components/navigation/AppBar';
import { Card } from '@/components/shared/Card';
import { ProductCard } from '@/components/shared/ProductCard';
import { homeCategories } from '@/lib/mock-data';
import { fetchTrendingProducts } from '@/lib/api';
import { Product } from '@/types/product';

const TRENDING_PREVIEW_LIMIT = 10;

export default function HomePage() {
  const [trending, setTrending] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadTrending = async () => {
      try {
        const data = await fetchTrendingProducts({
          limit: TRENDING_PREVIEW_LIMIT,
          matchedProductsCountGt: 3,
          matchedProductsCountLt: 6
        });
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

  const previewProducts = trending.slice(0, TRENDING_PREVIEW_LIMIT);
  const autoScrollProducts = previewProducts.length ? [...previewProducts, ...previewProducts] : [];

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
            <div className="overflow-hidden">
              <div className="flex gap-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={`shimmer-${index}`}
                    className="shimmer-card h-[238px] w-[164px] shrink-0 overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-0"
                  >
                    <div className="modern-shimmer h-24 w-full rounded-t-2xl" />
                    <div className="space-y-2 p-3">
                      <div className="modern-shimmer h-4 w-11/12 rounded-md" />
                      <div className="modern-shimmer h-4 w-7/12 rounded-md" />
                      <div className="modern-shimmer h-5 w-6/12 rounded-lg" />
                      <div className="modern-shimmer h-9 w-full rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : previewProducts.length ? (
            <div className="overflow-hidden">
              <div className="preview-track flex w-max gap-4">
                {autoScrollProducts.map((product, index) => (
                  <ProductCard
                    key={`${product.productId}-${index}`}
                    product={product}
                    compact
                    homePopular
                    className="w-[164px] shrink-0 border-gray-200/70 shadow-none"
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No trending products available right now.</p>
          )}
        </section>
      </div>

      <style jsx>{`
        .preview-track {
          animation: preview-marquee 36s linear infinite;
          will-change: transform;
        }

        .preview-track:hover {
          animation-play-state: paused;
        }

        .modern-shimmer {
          position: relative;
          overflow: hidden;
          background: linear-gradient(110deg, #f3f4f6 10%, #ffffff 40%, #e5e7eb 60%, #f3f4f6 90%);
          background-size: 220% 100%;
          animation: modern-shimmer 1.4s linear infinite;
        }

        @keyframes preview-marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes modern-shimmer {
          0% {
            background-position: 120% 0;
          }
          100% {
            background-position: -120% 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .preview-track {
            animation: none;
          }

          .modern-shimmer {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
