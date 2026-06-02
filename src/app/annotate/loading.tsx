import { Skeleton } from '@/components/ui/skeleton';

export default function AnnotateLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-8">
      <div className="space-y-1">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="rounded-lg border p-5 space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-9 w-56" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-5 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <div className="flex gap-1">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-1.5 w-full" />
            </div>
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
