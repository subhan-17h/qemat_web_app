import { Card } from '@/components/shared/Card';

export function SkeletonCard() {
  return (
    <Card className="animate-pulse p-0" role="status" aria-live="polite">
      <div className="h-32 w-full rounded-t-2xl bg-gray-200" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-2/3 rounded bg-gray-200" />
        <div className="h-5 w-1/2 rounded bg-gray-200" />
        <div className="h-8 w-full rounded-xl bg-gray-200" />
      </div>
    </Card>
  );
}
