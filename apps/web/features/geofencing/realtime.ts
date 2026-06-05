import type { RealtimeSnapshotRefreshConfig } from '@/shared/realtime/types';

export const GEOFENCING_REALTIME_REFRESH_CONFIG: RealtimeSnapshotRefreshConfig = {
  scope: 'geofencing',
  tables: [
    { schema: 'public', table: 'zones' },
    { schema: 'public', table: 'groups' },
    { schema: 'public', table: 'group_members' },
    { schema: 'public', table: 'alexa_triggers' },
    { schema: 'public', table: 'location_events' },
    { schema: 'public', table: 'profiles' },
  ],
  throttleMs: 1500,
};
