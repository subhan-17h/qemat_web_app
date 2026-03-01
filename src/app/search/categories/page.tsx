'use client';

import Image from 'next/image';
import Link from 'next/link';

import { AppBar } from '@/components/navigation/AppBar';
import { Card } from '@/components/shared/Card';
import { groceryCategories } from '@/lib/mock-data';

export default function GroceryCategoriesPage() {
  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 pb-8 lg:px-8">
      <AppBar title="Grocery Foods" showBack />

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {groceryCategories.map((category) => (
          <Link key={category.slug} href={`/search?category=${category.slug}`}>
            <Card className="flex min-h-28 items-center gap-3 p-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{category.name}</p>
                {category.transliteration ? <p className="text-xs text-gray-500">{category.transliteration}</p> : null}
                <p className="text-xs text-gray-500">
                  <span dir="rtl" className="font-urdu">
                    {category.urdu}
                  </span>
                </p>
              </div>
              <Image src={category.image} alt={category.name} width={60} height={60} className="rounded-lg object-cover" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
