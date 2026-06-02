import { Skeleton } from '@/components/ui/skeleton';

export default function TaskDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-8">
      <Skeleton className="h-4 w-48" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-36" />
        </div>
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

      <div className="rounded-lg border overflow-hidden">
        <div className="flex border-b px-4 gap-4">
          {['Annotations', 'Agreement', 'Dimension Breakdown'].map((t) => (
            <Skeleton key={t} className="h-9 w-28 my-2" />
          ))}
        </div>
        <div className="p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center border-b pb-4 last:border-b-0 last:pb-0">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
