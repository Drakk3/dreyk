'use client';

import * as React from 'react';

import { DataCard } from '@/components/thegridcn/data-card';

import type { DashboardEvent } from '../types';

type Filter = 'ALL' | 'ENTER' | 'EXIT';

const FILTERS: Filter[] = ['ALL', 'ENTER', 'EXIT'];

interface EventsTableProps {
  events: DashboardEvent[];
}

export function EventsTable({ events }: EventsTableProps): JSX.Element {
  const [filter, setFilter] = React.useState<Filter>('ALL');

  const filteredEvents =
    filter === 'ALL' ? events : events.filter((event) => event.type === filter.toLowerCase());

  return (
    <DataCard
      title="LOCATION_EVENTS / MOCK RECENT"
      subtitle="EVENT LOG PREVIEW"
      headerRight={
        <div className="flex gap-1">
          {FILTERS.map((filterOption) => (
            <button
              key={filterOption}
              type="button"
              onClick={() => setFilter(filterOption)}
              className={`px-2 h-6 rounded font-mono text-[10px] tracking-widest ${
                filter === filterOption
                  ? 'border-thin border-primary/50 bg-primary/15 text-primary'
                  : 'text-foreground/40 hover:text-primary'
              }`}
            >
              {filterOption}
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
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className="grid grid-cols-[80px_1fr_1fr_70px_60px] gap-3 px-4 py-2.5 items-center hover:bg-primary/5"
          >
            <span className="font-mono text-[11px] text-foreground/60">{event.t}</span>
            <span className="font-mono text-[11px] tracking-widest uppercase truncate">{event.user}</span>
            <span className="font-mono text-[11px] tracking-widest uppercase truncate text-foreground/80">
              {event.zone}
            </span>
            <span
              className={`font-mono text-[10px] tracking-widest uppercase px-1.5 py-px rounded inline-block w-fit border-thin ${
                event.type === 'enter'
                  ? 'bg-primary/15 text-primary border-primary/40'
                  : 'bg-accent/15 text-accent border-accent/40'
              }`}
            >
              {event.type}
            </span>
            <span className="font-mono text-[11px] text-right text-foreground/70">{event.dist}M</span>
          </div>
        ))}
      </div>
    </DataCard>
  );
}
