import type { RealtimeSnapshotRefreshConfig } from '@/shared/realtime/types';

export const ZONE_MANAGEMENT_REALTIME_REFRESH_CONFIG: RealtimeSnapshotRefreshConfig = {
  scope: 'admin-zones',
  tables: [
    { schema: 'public', table: 'zones' },
    { schema: 'public', table: 'groups' },
    { schema: 'public', table: 'alexa_triggers' },
    { schema: 'public', table: 'location_events' },
  ],
  throttleMs: 1500,
};
