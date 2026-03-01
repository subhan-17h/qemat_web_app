import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600', className)}>
      {children}
    </span>
  );
}
