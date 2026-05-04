import * as React from 'react';
import { DataCard } from '@/components/ui/DataCard';
import type { DashboardProfile, DashboardUserPin, DashboardZone } from '@/features/geofencing/types';

interface MembersPanelProps {
  profiles: DashboardProfile[];
  userPins: DashboardUserPin[];
  zones: DashboardZone[];
}

export function MembersPanel({ profiles, userPins, zones }: MembersPanelProps): JSX.Element {
  return (
    <DataCard
      title="GROUP-α / MEMBERS"
      subtitle="GROUP_MEMBERS"
      headerRight={
        <span className="font-mono text-[10px] tracking-widest text-foreground/40">
          {profiles.length} ACTIVE
        </span>
      }
    >
      <div className="divide-y divide-border/30">
        {profiles.map((p) => {
          const pin = userPins.find((pp) => pp.id === p.id);
          const insideZone =
            pin?.zone !== null && pin?.zone !== undefined
              ? (zones.find((z) => z.id === pin.zone)?.name ?? null)
              : null;
          return (
            <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
              <div
                className="size-8 rounded-full border-thin border-primary/40 flex items-center justify-center font-mono text-xs shrink-0"
                style={{
                  background: `color-mix(in oklch, ${p.color} 18%, transparent)`,
                  color: p.color,
                }}
              >
                {p.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs tracking-widest uppercase truncate">{p.name}</div>
                <div className="font-mono text-[10px] tracking-widest text-foreground/40 uppercase">
                  {p.role} · {insideZone !== null ? `IN ${insideZone}` : 'OUT OF ZONE'}
                </div>
              </div>
              <span
                className={`size-1.5 rounded-full shrink-0 ${insideZone !== null ? 'bg-primary' : 'bg-foreground/20'}`}
                style={insideZone !== null ? { boxShadow: '0 0 6px var(--primary)' } : undefined}
              />
            </div>
          );
        })}
      </div>
    </DataCard>
  );
}
