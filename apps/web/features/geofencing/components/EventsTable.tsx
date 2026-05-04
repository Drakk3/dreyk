'use client';

import * as React from 'react';
import { DataCard } from '@/components/ui/DataCard';
import type { DashboardEvent } from '@/features/geofencing/types';

type Filter = 'ALL' | 'ENTER' | 'EXIT';

const FILTERS: Filter[] = ['ALL', 'ENTER', 'EXIT'];

interface EventsTableProps {
  events: DashboardEvent[];
}

export function EventsTable({ events }: EventsTableProps): JSX.Element {
  const [filter, setFilter] = React.useState<Filter>('ALL');

  const filtered =
    filter === 'ALL' ? events : events.filter((e) => e.type === filter.toLowerCase());

  return (
    <DataCard
      title="LOCATION_EVENTS / MOCK RECENT"
      subtitle="EVENT LOG PREVIEW"
      headerRight={
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-2 h-6 rounded font-mono text-[10px] tracking-widest ${
                filter === f
                  ? 'border-thin border-primary/50 bg-primary/15 text-primary'
                  : 'text-foreground/40 hover:text-primary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      }
    >
      <div className="font-mono text-[10px] tracking-widest text-foreground/40 uppercase grid grid-cols-[80px_1fr_1fr_70px_60px] gap-3 px-4 py-2 border-b border-border/30">
        <span>TIME</span>
        <span>USER</span>
        <span>ZONE</span>
        <span>TYPE</span>
        <span className="text-right">DIST</span>
      </div>
      <div className="divide-y divide-border/20 max-h-[260px] overflow-y-auto">
        {filtered.map((e) => (
          <div
            key={e.id}
            className="grid grid-cols-[80px_1fr_1fr_70px_60px] gap-3 px-4 py-2.5 items-center hover:bg-primary/5"
          >
            <span className="font-mono text-[11px] text-foreground/60">{e.t}</span>
            <span className="font-mono text-[11px] tracking-widest uppercase truncate">
              {e.user}
            </span>
            <span className="font-mono text-[11px] tracking-widest uppercase truncate text-foreground/80">
              {e.zone}
            </span>
            <span
              className={`font-mono text-[10px] tracking-widest uppercase px-1.5 py-px rounded inline-block w-fit border-thin ${
                e.type === 'enter'
                  ? 'bg-primary/15 text-primary border-primary/40'
                  : 'bg-accent/15 text-accent border-accent/40'
              }`}
            >
              {e.type}
            </span>
            <span className="font-mono text-[11px] text-right text-foreground/70">{e.dist}M</span>
          </div>
        ))}
      </div>
    </DataCard>
  );
}
