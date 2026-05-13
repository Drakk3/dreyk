'use client';

import * as React from 'react';
import { DataCard } from '@/components/thegridcn/data-card';
import { Button } from '@/components/ui/button';
import type { DashboardZone } from '@/shared/types/dashboard';

interface ZoneRosterProps {
  zones: DashboardZone[];
  selectedZone: string;
  onSelect: (id: string) => void;
}

export function ZoneRoster({ zones, selectedZone, onSelect }: ZoneRosterProps): JSX.Element {
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
        {zones.map((z) => {
          const sel = selectedZone === z.id;
          return (
            <button
              key={z.id}
              type="button"
              onClick={() => onSelect(z.id)}
              className={`w-full grid grid-cols-[12px_1fr_auto] items-center gap-3 px-4 py-3 text-left transition-colors ${
                sel ? 'bg-primary/10' : 'hover:bg-primary/5'
              }`}
            >
              <span className={`font-mono ${sel ? 'text-accent' : 'text-primary'}`}>|</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm tracking-widest uppercase truncate">
                    {z.name}
                  </span>
                  {z.alexa && (
                    <span className="font-mono text-[9px] tracking-widest uppercase border-thin border-primary/30 px-1 py-px text-primary shrink-0">
                      ALEXA
                    </span>
                  )}
                  {!z.active && (
                    <span className="font-mono text-[9px] tracking-widest uppercase text-foreground/40 shrink-0">
                      OFFLINE
                    </span>
                  )}
                </div>
                <div className="font-mono text-[10px] text-foreground/40 tracking-widest uppercase">
                  R={z.radius_m}M · MEMBERS={z.members} · {z.id}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div
                  className={`font-mono text-xs tracking-widest uppercase ${
                    z.active ? 'text-primary' : 'text-foreground/40'
                  }`}
                >
                  {z.active ? 'ACTIVE' : 'PAUSED'}
                </div>
                <div className="font-mono text-[10px] text-foreground/40">
                  {z.members} / {z.members + 2}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </DataCard>
  );
}
