'use client';

import { DataCard } from '@/components/thegridcn/data-card';
import { Button } from '@/components/ui/button';

import type { DashboardZone } from '../types';

interface ZoneRosterProps {
  onSelect: (id: string) => void;
  selectedZone: string;
  zones: DashboardZone[];
}

export function ZoneRoster({ onSelect, selectedZone, zones }: ZoneRosterProps): JSX.Element {
  return (
    <DataCard
      title="GEOFENCE REGISTRY"
      subtitle="ZONES / GROUP-α"
      headerRight={
        <Button
          disabled
          size="sm"
          variant="outline"
          className="font-mono text-[10px] tracking-widest uppercase shrink-0"
        >
          + MOCK
        </Button>
      }
    >
      <div className="divide-y divide-border/30">
        {zones.map((zone) => {
          const isSelected = selectedZone === zone.id;

          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => onSelect(zone.id)}
              className={`w-full grid grid-cols-[12px_1fr_auto] items-center gap-3 px-4 py-3 text-left transition-colors ${
                isSelected ? 'bg-primary/10' : 'hover:bg-primary/5'
              }`}
            >
              <span className={`font-mono ${isSelected ? 'text-accent' : 'text-primary'}`}>|</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm tracking-widest uppercase truncate">{zone.name}</span>
                  {zone.alexa ? (
                    <span className="font-mono text-[9px] tracking-widest uppercase border-thin border-primary/30 px-1 py-px text-primary shrink-0">
                      ALEXA
                    </span>
                  ) : null}
                  {!zone.active ? (
                    <span className="font-mono text-[9px] tracking-widest uppercase text-foreground/40 shrink-0">
                      OFFLINE
                    </span>
                  ) : null}
                </div>
                <div className="font-mono text-[10px] text-foreground/40 tracking-widest uppercase">
                  R={zone.radius_m}M · MEMBERS={zone.members} · {zone.id}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div
                  className={`font-mono text-xs tracking-widest uppercase ${
                    zone.active ? 'text-primary' : 'text-foreground/40'
                  }`}
                >
                  {zone.active ? 'ACTIVE' : 'PAUSED'}
                </div>
                <div className="font-mono text-[10px] text-foreground/40">
                  {zone.members} / {zone.members + 2}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </DataCard>
  );
}
