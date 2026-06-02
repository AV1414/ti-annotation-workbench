'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AnnotateError({
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
      <div className="text-4xl">✏️</div>
      <div>
        <h2 className="text-xl font-bold">Could not load annotation tasks</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          There was a problem fetching the available tasks. Please try again.
        </p>
      </div>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" asChild><Link href="/">Home</Link></Button>
        <Button onClick={reset}>Retry</Button>
      </div>
    </div>
  );
}
