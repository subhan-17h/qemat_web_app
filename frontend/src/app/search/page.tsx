import { Suspense } from 'react';

import SearchPageClient from '@/app/search/SearchPageClient';

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageClient />
    </Suspense>
  );
}
