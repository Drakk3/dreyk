'use client';

import { DataCard } from '@/components/thegridcn/data-card';
import { Button } from '@/components/ui/button';

import type { ZoneManagementSnapshot } from '../types';

interface ZoneManagementListProps {
  onCreateZone: () => void;
  onSelectZone: (zoneId: string) => void;
  selectedZoneId: string | null;
  zones: ZoneManagementSnapshot['zones'];
}

export function ZoneManagementList({ onCreateZone, onSelectZone, selectedZoneId, zones }: ZoneManagementListProps): JSX.Element {
  return (
    <DataCard
      title="Persisted zones"
      subtitle="Admin-only list"
      headerRight={
        <Button onClick={onCreateZone} size="sm" variant="outline">
          Create zone
        </Button>
      }
    >
      <div className="space-y-3 p-4">
        {zones.length === 0 ? (
          <p className="text-sm text-muted-foreground">No persisted zones yet. Create the first zone from this admin surface.</p>
        ) : (
          zones.map((zone) => (
            <button
              key={zone.id}
              className={`w-full rounded border px-3 py-3 text-left transition ${zone.id === selectedZoneId ? 'border-primary bg-primary/10' : 'border-border/50 bg-background/50 hover:border-primary/40'}`}
              onClick={() => onSelectZone(zone.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground">{zone.name}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.08em] text-muted-foreground">
                    {zone.groupName ?? 'Unavailable group'} · {zone.radiusMeters}m
                  </div>
                  <div className="mt-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    Alexa · {zone.alexa.statusLabel}
                  </div>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/55">
                  {zone.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </DataCard>
  );
}
