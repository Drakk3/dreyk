import { DataCard } from '@/components/thegridcn/data-card';

import type { DashboardProfile, DashboardUserPin, DashboardZone } from '../types';

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
        {profiles.map((profile) => {
          const pin = userPins.find((userPin) => userPin.id === profile.id);
          const insideZone =
            pin?.zone !== null && pin?.zone !== undefined
              ? (zones.find((zone) => zone.id === pin.zone)?.name ?? null)
              : null;

          return (
            <div key={profile.id} className="flex items-center gap-3 px-4 py-2.5">
              <div
                className="size-8 rounded-full border-thin border-primary/40 flex items-center justify-center font-mono text-xs shrink-0"
                style={{
                  background: `color-mix(in oklch, ${profile.color} 18%, transparent)`,
                  color: profile.color,
                }}
              >
                {profile.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs tracking-widest uppercase truncate">{profile.name}</div>
                <div className="font-mono text-[10px] tracking-widest text-foreground/40 uppercase">
                  {profile.role} · {insideZone !== null ? `IN ${insideZone}` : 'OUT OF ZONE'}
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
