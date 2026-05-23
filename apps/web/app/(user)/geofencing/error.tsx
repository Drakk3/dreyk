'use client';

import { Button } from '@/components/ui/button';

interface GeofencingErrorProps {
  error: Error;
  reset: () => void;
}

export default function GeofencingError({ error, reset }: GeofencingErrorProps): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md rounded border border-destructive/40 bg-card/90 p-6 text-center backdrop-blur-sm">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-destructive">Geofencing workspace unavailable</div>
        <p className="mt-3 text-sm uppercase tracking-[0.08em] text-muted-foreground">
          The read-only workspace could not load. Retry the snapshot fetch.
        </p>
        <p className="mt-3 text-xs text-foreground/60">{error.message}</p>
        <Button className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em]" onClick={reset} type="button">
          Retry workspace
        </Button>
      </div>
    </div>
  );
}
