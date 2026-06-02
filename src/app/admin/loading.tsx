import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="border-b bg-muted/40 px-4 py-3 flex gap-6">
          {['Task', 'Type', 'Scale', 'Dimensions', 'Prompts', 'Status', 'Created', 'Actions'].map((h) => (
            <Skeleton key={h} className="h-4 w-16" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-6 px-4 py-4 border-b last:border-b-0 items-center">
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-8 mx-auto" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
