'use client';

interface GeofencingLoadingProps {}

export default function GeofencingLoading(_props: GeofencingLoadingProps): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="rounded border border-border bg-card/80 px-6 py-5 text-center backdrop-blur-sm">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Loading geofencing workspace</div>
        <p className="mt-2 text-sm uppercase tracking-[0.12em] text-muted-foreground">
          Fetching the latest read-only zone and event snapshot.
        </p>
      </div>
    </div>
  );
}
