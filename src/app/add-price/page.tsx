import { Suspense } from 'react';

import AddPricePageClient from '@/app/add-price/AddPricePageClient';

export default function AddPricePage() {
  return (
    <Suspense fallback={null}>
      <AddPricePageClient />
    </Suspense>
  );
}
