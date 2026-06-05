'use client';

import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type RealtimeSnapshotScope = 'admin-zones' | 'geofencing';

export type RealtimeSnapshotTable =
  | 'alexa_triggers'
  | 'group_members'
  | 'groups'
  | 'location_events'
  | 'profiles'
  | 'zones';

export interface RealtimeTableSubscription {
  schema: 'public';
  table: RealtimeSnapshotTable;
}

export interface RealtimeSnapshotRefreshConfig {
  scope: RealtimeSnapshotScope;
  tables: RealtimeTableSubscription[];
  throttleMs: number;
}

export type RealtimeSnapshotPayload = RealtimePostgresChangesPayload<Record<string, unknown>>;
