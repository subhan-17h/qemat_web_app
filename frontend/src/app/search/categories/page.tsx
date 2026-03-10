'use client';

import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { AppBar } from '@/components/navigation/AppBar';
import { Card } from '@/components/shared/Card';
import { groceryCategories } from '@/lib/mock-data';

export default function GroceryCategoriesPage() {
  const [playEntryAnimation, setPlayEntryAnimation] = useState(false);

  useEffect(() => {
    const shouldAnimate = sessionStorage.getItem('qemat-categories-entry') === 'home-grocery';
    if (shouldAnimate) {
      setPlayEntryAnimation(true);
      sessionStorage.removeItem('qemat-categories-entry');
    }
  }, []);

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 pb-8 lg:px-8">
      <AppBar title="Grocery Foods" showBack sticky />

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {groceryCategories.map((category, index) => (
          <Link
            key={category.slug}
            href={{ pathname: '/search', query: { category: category.slug } }}
            className={playEntryAnimation ? 'category-card-enter' : ''}
            style={
              {
                '--category-delay': `${index * 42}ms`,
                '--category-start-x': `${(index % 2 === 0 ? -1 : 1) * (10 + (index % 3) * 3)}px`,
                '--category-start-y': `${18 + (index % 4) * 4}px`,
                '--category-start-rot': `${(index % 2 === 0 ? -1 : 1) * 1.8}deg`
              } as CSSProperties
            }
          >
            <Card className="category-card flex min-h-28 items-center gap-3 p-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{category.name}</p>
                {category.transliteration ? <p className="text-xs text-gray-500">{category.transliteration}</p> : null}
                {category.urdu ? (
                  <p className="text-xs text-gray-500">
                    <span dir="rtl" className="font-urdu">
                      {category.urdu}
                    </span>
                  </p>
                ) : null}
              </div>
              <Image src={category.image} alt={category.name} width={60} height={60} className="rounded-lg object-cover" />
            </Card>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .category-card {
          transform: translateZ(0);
          transition: transform 260ms ease, box-shadow 260ms ease;
        }

        .category-card-enter {
          opacity: 0;
          animation: category-parallax-enter 680ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
          animation-delay: var(--category-delay);
        }

        .category-card-enter .category-card {
          transform-origin: center;
        }

        @keyframes category-parallax-enter {
          0% {
            opacity: 0;
            transform: translate3d(var(--category-start-x), var(--category-start-y), 0) rotate(var(--category-start-rot)) scale(0.93);
            filter: blur(8px);
          }
          65% {
            opacity: 1;
            transform: translate3d(0, -2px, 0) rotate(0deg) scale(1.01);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
            filter: blur(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .category-card-enter {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
