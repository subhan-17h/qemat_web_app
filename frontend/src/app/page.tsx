'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, ShoppingBasket, Sparkles } from 'lucide-react';
import { type MouseEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AppBar } from '@/components/navigation/AppBar';
import { Card } from '@/components/shared/Card';
import { ProductCard } from '@/components/shared/ProductCard';
import { homeCategories } from '@/lib/mock-data';
import { fetchTrendingProducts } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Product } from '@/types/product';

const TRENDING_PREVIEW_LIMIT = 10;
const TRENDING_CACHE_TTL_MS = 5 * 60 * 1000;

let trendingProductsCache: {
  products: Product[];
  cachedAt: number;
} | null = null;

export default function HomePage() {
  const router = useRouter();
  const [trending, setTrending] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const handlePageOpenTransition = (event: MouseEvent<HTMLElement>, href: string) => {
    const isModifiedClick = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
    if (isModifiedClick) return;

    if (href.startsWith('/search/categories')) {
      sessionStorage.setItem('qemat-categories-entry', 'home-grocery');
    }

    const docWithTransition = document as Document & {
      startViewTransition?: (callback: () => void) => { finished: Promise<void> };
    };

    if (docWithTransition.startViewTransition) {
      event.preventDefault();
      const root = document.documentElement;
      const card = event.currentTarget as HTMLElement;
      const rect = card.getBoundingClientRect();
      const originX = `${((rect.left + rect.width / 2) / window.innerWidth) * 100}%`;
      const originY = `${((rect.top + rect.height / 2) / window.innerHeight) * 100}%`;

      root.setAttribute('data-nav-intent', 'browse-open');
      root.style.setProperty('--vt-origin-x', originX);
      root.style.setProperty('--vt-origin-y', originY);

      const transition = docWithTransition.startViewTransition(() => {
        router.push(href);
      });
      transition.finished.finally(() => {
        root.removeAttribute('data-nav-intent');
        root.style.removeProperty('--vt-origin-x');
        root.style.removeProperty('--vt-origin-y');
      });
    }
  };

  useEffect(() => {
    let active = true;

    const loadTrending = async () => {
      const now = Date.now();
      const cached = trendingProductsCache;

      if (cached) {
        setTrending(cached.products);
        setLoading(false);
      }

      const shouldFetch = !cached || now - cached.cachedAt >= TRENDING_CACHE_TTL_MS;
      if (!shouldFetch) {
        return;
      }

      // Only show shimmer on true cold load (no cache available yet).
      if (!cached) {
        setLoading(true);
      }

      try {
        const data = await fetchTrendingProducts({
          limit: TRENDING_PREVIEW_LIMIT,
          matchedProductsCountGt: 3,
          matchedProductsCountLt: 6
        });
        if (active) {
          setTrending(data);
          trendingProductsCache = {
            products: data,
            cachedAt: Date.now()
          };
        }
      } catch (error) {
        console.error('Failed to load trending products.', error);
        if (active && !cached) {
          setTrending([]);
        }
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
    <div className="mx-auto h-full w-full max-w-screen-2xl overflow-hidden px-4 pb-2 lg:px-10 xl:px-12">
      <AppBar title="Qemat" />

      <div className="mt-4 space-y-5 lg:mt-3 lg:space-y-4">
        <Link
          href="/search?browse=true"
          onClick={(event) => handlePageOpenTransition(event, '/search?browse=true')}
          className="block"
        >
          <Card className="chalo-bazaar-cta group relative flex cursor-pointer items-center gap-3 overflow-hidden border-emerald-200/75 bg-gradient-to-r from-emerald-50/95 via-white to-teal-50/70 p-4">
            <span className="chalo-bazaar-icon-wrap relative grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white">
              <span className="chalo-bazaar-icon-pulse" aria-hidden />
              <ShoppingBasket size={21} strokeWidth={2.2} />
              <Sparkles size={12} className="absolute -right-1 -top-1 text-amber-300" />
            </span>
            <div className="flex-1">
              <p className="text-lg font-bold text-emerald-900">Chalo Bazaar</p>
              <p className="text-xs text-gray-600 md:text-sm">Apni shopping ka best daam dhoondo</p>
            </div>
            <ChevronRight className="chalo-bazaar-arrow text-emerald-700/85" size={20} />
          </Card>
        </Link>

        <section className="pt-1 lg:-mt-1 lg:pt-0">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-4">
            {homeCategories.map((category) => {
              const href = category.key === 'grocery' ? '/search/categories' : '/search?pharma=true';
              const categoryDescription =
                category.key === 'grocery' ? 'Daily staples at the best rates' : 'Medicines and wellness picks';

              return (
                <Link
                  key={category.key}
                  href={href}
                  onClick={(event) => handlePageOpenTransition(event, href)}
                  className={cn(
                    'home-category-card group relative min-h-[132px] overflow-hidden rounded-2xl border border-white/75 p-4 transition duration-300 ease-out lg:min-h-[150px] lg:p-[18px]',
                    category.key === 'grocery' ? 'home-category-card-grocery' : 'home-category-card-pharma'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="home-category-icon mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-white/90 shadow-sm lg:mx-0 lg:mb-3 lg:h-12 lg:w-12">
                      <Image src={category.image} alt={category.title} width={30} height={30} />
                    </div>
                    <span className="hidden rounded-full border border-white/70 bg-white/75 px-2.5 py-1 text-[11px] font-semibold text-emerald-800/90 shadow-sm backdrop-blur-sm lg:inline-flex">
                      {category.key === 'grocery' ? 'Essentials' : 'Health'}
                    </span>
                  </div>
                  <div className="space-y-0.5 text-center lg:text-left">
                    <p className="text-[15px] font-semibold text-gray-900 lg:text-[24px] lg:font-bold lg:tracking-tight">
                      {category.title}
                    </p>
                    <p className="text-xs text-gray-600 lg:text-sm">
                      <span dir="rtl" className="font-urdu">
                        {category.urdu}
                      </span>
                    </p>
                    <p className="hidden pt-1.5 text-[11px] font-medium text-gray-700/80 2xl:block">{categoryDescription}</p>
                  </div>
                  <ChevronRight className="home-category-arrow absolute bottom-4 right-4 text-gray-700/65 lg:bottom-4 lg:right-4" size={20} />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="space-y-4 pt-1 lg:pt-0">
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
                  <div
                    key={`${product.productId}-${index}`}
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push(`/product/${product.productId}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        router.push(`/product/${product.productId}`);
                      }
                    }}
                    className="w-[164px] shrink-0 cursor-pointer"
                  >
                    <ProductCard
                      product={product}
                      compact
                      homePopular
                      className="w-[164px] border-gray-200/70 shadow-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No trending products available right now.</p>
          )}
        </section>
      </div>

      <style jsx>{`
        .chalo-bazaar-cta {
          transition:
            transform 260ms cubic-bezier(0.2, 0.9, 0.2, 1),
            box-shadow 280ms ease,
            border-color 220ms ease;
          box-shadow:
            0 16px 30px -28px rgba(15, 23, 42, 0.62),
            inset 0 1px 0 rgba(255, 255, 255, 0.86);
        }

        .chalo-bazaar-cta::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          background: linear-gradient(110deg, rgba(16, 185, 129, 0.12) 0%, rgba(255, 255, 255, 0) 35%, rgba(16, 185, 129, 0.09) 100%);
          pointer-events: none;
        }

        .chalo-bazaar-cta:hover {
          transform: translateY(-1px);
          border-color: rgba(16, 185, 129, 0.55);
          box-shadow:
            0 20px 34px -28px rgba(16, 185, 129, 0.55),
            0 12px 20px -18px rgba(15, 23, 42, 0.48),
            inset 0 1px 0 rgba(255, 255, 255, 0.92);
        }

        .chalo-bazaar-icon-wrap {
          background: linear-gradient(145deg, #34d399 0%, #10b981 62%, #059669 100%);
          box-shadow:
            0 14px 24px -18px rgba(16, 185, 129, 0.92),
            inset 0 1px 0 rgba(255, 255, 255, 0.46);
        }

        .chalo-bazaar-icon-pulse {
          position: absolute;
          inset: -4px;
          border-radius: 0.9rem;
          border: 1px solid rgba(16, 185, 129, 0.35);
          animation: chalo-bazaar-pulse 2.2s cubic-bezier(0.2, 0.9, 0.2, 1) infinite;
          pointer-events: none;
        }

        .chalo-bazaar-arrow {
          transition: transform 240ms cubic-bezier(0.2, 0.9, 0.2, 1);
        }

        .group:hover .chalo-bazaar-arrow {
          transform: translateX(2px);
        }

        .home-category-card {
          backdrop-filter: blur(14px) saturate(152%);
          -webkit-backdrop-filter: blur(14px) saturate(152%);
          box-shadow:
            0 20px 32px -28px rgba(15, 23, 42, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.78);
        }

        .home-category-card::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          background:
            radial-gradient(88% 66% at 18% 12%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.02) 58%),
            radial-gradient(62% 52% at 84% 14%, rgba(255, 255, 255, 0.26) 0%, rgba(255, 255, 255, 0.04) 64%);
          pointer-events: none;
        }

        .home-category-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(118deg, rgba(255, 255, 255, 0) 10%, rgba(255, 255, 255, 0.52) 45%, rgba(255, 255, 255, 0) 70%);
          transform: translateX(-118%);
          transition: transform 520ms cubic-bezier(0.2, 0.9, 0.2, 1);
          pointer-events: none;
        }

        .home-category-card-grocery {
          background:
            radial-gradient(74% 62% at 12% 10%, rgba(255, 255, 255, 0.56) 0%, rgba(255, 255, 255, 0) 62%),
            linear-gradient(145deg, rgba(167, 243, 208, 0.92) 0%, rgba(110, 231, 183, 0.86) 46%, rgba(16, 185, 129, 0.78) 100%);
          border-color: rgba(16, 185, 129, 0.34);
        }

        .home-category-card-pharma {
          background:
            radial-gradient(74% 62% at 12% 10%, rgba(255, 255, 255, 0.56) 0%, rgba(255, 255, 255, 0) 62%),
            linear-gradient(145deg, rgba(186, 230, 253, 0.93) 0%, rgba(147, 197, 253, 0.87) 44%, rgba(99, 102, 241, 0.79) 100%);
          border-color: rgba(59, 130, 246, 0.32);
        }

        .home-category-card:hover {
          transform: translateY(-2px) scale(1.002);
          box-shadow:
            0 26px 40px -26px rgba(15, 23, 42, 0.46),
            0 18px 28px -22px rgba(16, 185, 129, 0.34),
            inset 0 1px 0 rgba(255, 255, 255, 0.92);
        }

        .home-category-card:hover::after {
          transform: translateX(120%);
        }

        .home-category-icon {
          transition:
            transform 280ms cubic-bezier(0.2, 0.9, 0.2, 1),
            box-shadow 260ms ease;
          background: rgba(255, 255, 255, 0.9);
          box-shadow:
            0 16px 22px -18px rgba(15, 23, 42, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.95);
        }

        .home-category-card:hover .home-category-icon {
          transform: translateY(-1px) scale(1.03);
          box-shadow:
            0 18px 26px -16px rgba(16, 185, 129, 0.42),
            inset 0 1px 0 rgba(255, 255, 255, 0.95);
        }

        .home-category-arrow {
          transition: transform 230ms cubic-bezier(0.2, 0.9, 0.2, 1);
        }

        .home-category-card:hover .home-category-arrow {
          transform: translateX(2px);
        }

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

        @keyframes chalo-bazaar-pulse {
          0% {
            opacity: 0.35;
            transform: scale(1);
          }
          70% {
            opacity: 0;
            transform: scale(1.1);
          }
          100% {
            opacity: 0;
            transform: scale(1.12);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .chalo-bazaar-cta,
          .chalo-bazaar-cta:hover,
          .chalo-bazaar-arrow,
          .group:hover .chalo-bazaar-arrow,
          .home-category-card,
          .home-category-card:hover,
          .home-category-icon,
          .home-category-card:hover .home-category-icon,
          .home-category-arrow,
          .home-category-card:hover .home-category-arrow,
          .home-category-card::after {
            transition: none;
            transform: none;
          }

          .chalo-bazaar-icon-pulse {
            animation: none;
          }

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
