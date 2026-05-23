'use client';

import { DataCard } from '@/components/thegridcn/data-card';

import type { SharedGeofencingZoneView } from './types';

interface ZoneDetailsPanelProps {
  selectedZone: SharedGeofencingZoneView | null;
}

function formatCoordinate(value: number): string {
  return value.toFixed(5);
}

export function ZoneDetailsPanel({ selectedZone }: ZoneDetailsPanelProps): JSX.Element {
  if (selectedZone === null) {
    return (
      <DataCard title="Zone details" subtitle="Read-only metadata">
        <div className="p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">No zone selected</div>
          <p className="mt-2 text-xs uppercase tracking-[0.08em] text-muted-foreground">
            The snapshot has no zone metadata to inspect yet.
          </p>
        </div>
      </DataCard>
    );
  }

  return (
    <DataCard
      title={selectedZone.name}
      subtitle="Selected zone"
      fields={[
        { label: 'Group', value: selectedZone.groupName ?? 'Unavailable' },
        { label: 'Status', value: selectedZone.isActive ? 'Active' : 'Inactive', highlight: selectedZone.isActive },
        { label: 'Radius', value: `${selectedZone.radiusMeters} meters` },
        { label: 'Latitude', value: formatCoordinate(selectedZone.latitude) },
        { label: 'Longitude', value: formatCoordinate(selectedZone.longitude) },
        { label: 'Alexa trigger', value: selectedZone.hasAlexaTrigger ? 'Linked' : 'Not linked' },
        { label: 'Recent events', value: `${selectedZone.recentEventCount}` },
      ]}
    />
  );
}
