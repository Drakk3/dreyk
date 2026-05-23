'use client';

import { DataCard } from '@/components/thegridcn/data-card';

import type {
  GeofencingEventView,
  GeofencingWorkspaceAppliedFilters,
  GeofencingWorkspaceViewerScope,
} from '../types';

interface EventsPanelProps {
  appliedFilters: GeofencingWorkspaceAppliedFilters;
  events: GeofencingEventView[];
  viewerScope: GeofencingWorkspaceViewerScope;
}

function buildEmptyStateCopy(viewerScope: GeofencingWorkspaceViewerScope): string {
  return viewerScope === 'admin-global'
    ? 'No persisted location events are available in the current snapshot.'
    : 'No personal persisted location events are available under the current access policy.';
}

export function EventsPanel({ appliedFilters, events, viewerScope }: EventsPanelProps): JSX.Element {
  const filterSummary = appliedFilters.isAdminFilterable
    ? `Server filters · group ${appliedFilters.groupId ?? 'all'} · user ${appliedFilters.userId ?? 'all'} · event ${appliedFilters.eventType}`
    : 'Server filters · access policy enforced';

  return (
    <DataCard
      title="Recent events"
      subtitle="Persisted location history"
      headerRight={
        <div className="text-right font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/45">{filterSummary}</div>
      }
    >
      {events.length === 0 ? (
        <div className="p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">Empty event stream</div>
          <p className="mt-2 text-xs uppercase tracking-[0.08em] text-muted-foreground">{buildEmptyStateCopy(viewerScope)}</p>
        </div>
      ) : (
        <div className="max-h-[420px] divide-y divide-border/20 overflow-y-auto">
          {events.map((event) => (
            <article key={event.id} className="space-y-2 px-4 py-3 hover:bg-primary/5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-foreground">
                    {event.userDisplayName ?? 'Unavailable user'}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-foreground/50">
                    {event.zoneName ?? 'Unavailable zone'}
                  </div>
                </div>
                <span
                  className={`rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${
                    event.eventType === 'enter'
                      ? 'border-primary/50 bg-primary/15 text-primary'
                      : 'border-orange-400/50 bg-orange-400/10 text-orange-300'
                  }`}
                >
                  {event.eventType}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground/55">
                <span>{new Date(event.triggeredAt).toLocaleString()}</span>
                <span>{event.distanceMeters} meters</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </DataCard>
  );
}
