import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-8">
      <div className="space-y-1">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-5 space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>

      <div className="rounded-lg border p-5 space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="rounded-lg border overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-6 px-4 py-4 border-b last:border-b-0 items-center">
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-32 min-w-[120px]" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
