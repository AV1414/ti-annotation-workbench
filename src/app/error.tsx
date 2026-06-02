'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
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
      <div className="text-4xl">⚠️</div>
      <div>
        <h2 className="text-xl font-bold">Something went wrong</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message?.includes('KV') || error.message?.includes('Redis')
            ? 'The data store is temporarily unavailable. Try again in a moment.'
            : 'An unexpected error occurred loading this page.'}
        </p>
      </div>
      <Button onClick={reset}>Retry</Button>
    </div>
  );
}
