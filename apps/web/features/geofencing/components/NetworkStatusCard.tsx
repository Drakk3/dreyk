import { DataCard } from '@/components/thegridcn/data-card';
import { DataField } from '@/shared/components/primitives/DataField';

export function NetworkStatusCard(): JSX.Element {
  return (
    <DataCard title="DREYK / NETWORK" subtitle="MOCK STATUS">
      <div className="p-4 space-y-4">
        <DataField label="WEB / VERCEL" value="PREVIEW DATA · NOT LIVE" highlight />
        <DataField label="COMPANION / EAS" value="MOCK BUILD STATE" />
        <DataField label="SUPABASE" value="SESSION VERIFIED ONLY" />
        <DataField label="REALTIME CHANNEL" value="LOCATION_EVENTS / MOCK" accent />
        <DataField label="EDGE / ALEXA" value="PLACEHOLDER ENDPOINT STATE" />
        <DataField label="RLS" value="NOT VERIFIED BY THIS DASHBOARD" />

        <div className="mt-2 p-3 rounded border-thin border-destructive/40 bg-destructive/10 glow-destructive">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-destructive blink shrink-0" />
            <span className="font-mono text-[10px] tracking-widest text-destructive uppercase">ATTENTION</span>
          </div>
          <div className="mt-1 font-mono text-[11px] tracking-widest uppercase text-foreground/80">
            Mock degraded state for THEO.R companion token · preview only
          </div>
        </div>
      </div>
    </DataCard>
  );
}
