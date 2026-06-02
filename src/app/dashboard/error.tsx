'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center space-y-6">
      <div className="text-4xl">📊</div>
      <div>
        <h2 className="text-xl font-bold">Dashboard unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Could not load annotation statistics. The data store may be temporarily unavailable.
        </p>
      </div>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" asChild><Link href="/admin">Admin</Link></Button>
        <Button onClick={reset}>Retry</Button>
      </div>
    </div>
  );
}
