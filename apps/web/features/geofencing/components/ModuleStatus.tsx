import { DataCard } from '@/components/thegridcn/data-card';

interface ModulePreview {
  key: string;
  name: string;
  note: string;
  status: 'active' | 'alert';
}

const MODULES: ModulePreview[] = [
  { key: 'geofencing', name: 'GEOFENCING', status: 'active', note: 'MOCK MODULE · 5 ZONES' },
  { key: 'alexa', name: 'ALEXA TRIGGER', status: 'active', note: 'MOCK DEVICES LINKED' },
  { key: 'push', name: 'PUSH NOTIFY', status: 'active', note: 'MOCK FCM + APNS TOKENS' },
  { key: 'companion', name: 'COMPANION GPS', status: 'alert', note: 'MOCK TOKEN STALE STATE' },
];

export function ModuleStatus(): JSX.Element {
  return (
    <DataCard title="EDGE FUNCTIONS" subtitle="MODULE PREVIEW">
      <div className="divide-y divide-border/30">
        {MODULES.map((module) => (
          <div key={module.key} className="flex items-center gap-3 px-4 py-2.5">
            <span
              className={`size-1.5 rounded-full shrink-0 ${module.status === 'alert' ? 'bg-destructive blink' : 'bg-primary'}`}
              style={{
                boxShadow:
                  module.status === 'alert' ? '0 0 6px var(--destructive)' : '0 0 6px var(--primary)',
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="font-mono text-xs tracking-widest uppercase">{module.name}</div>
              <div className="font-mono text-[10px] tracking-widest text-foreground/40 uppercase truncate">
                {module.note}
              </div>
            </div>
            <span
              className={`font-mono text-[10px] tracking-widest uppercase shrink-0 ${
                module.status === 'alert' ? 'text-destructive' : 'text-primary'
              }`}
            >
              {module.status === 'alert' ? 'DEGRADED' : 'OK'}
            </span>
          </div>
        ))}
      </div>
    </DataCard>
  );
}
