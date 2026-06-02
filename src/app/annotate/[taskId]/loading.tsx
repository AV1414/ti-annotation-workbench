import { Skeleton } from '@/components/ui/skeleton';

export default function AnnotateTaskLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-14 z-40 border-b bg-background/95">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-48 flex-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 py-8 space-y-6">
        <Skeleton className="h-5 w-48" />

        <div className="rounded-lg border p-5 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex-1 rounded-lg border p-5 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full" />
          </div>
        </div>

        <Skeleton className="h-16 w-full rounded-lg" />

        <div className="flex justify-between items-center rounded-lg border bg-muted/30 px-4 py-3">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    </div>
  );
}
