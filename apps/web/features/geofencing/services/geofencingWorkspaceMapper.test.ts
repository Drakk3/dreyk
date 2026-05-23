import { describe, expect, it } from 'vitest';

import type {
  AlexaTriggerRow,
  GroupRow,
  LocationEventRow,
  ProfileRow,
  ZoneRow,
} from '@dreyk/shared/types/database';

import { mapGeofencingWorkspaceSnapshot } from './geofencingWorkspaceMapper';

function createZoneRows(): ZoneRow[] {
  return [
    {
      created_at: '2026-05-17T10:00:00.000Z',
      created_by: 'admin-1',
      group_id: 'group-1',
      id: 'zone-b',
      is_active: true,
      latitude: 4.61,
      longitude: -74.08,
      name: 'Bravo',
      radius_meters: 120,
    },
    {
      created_at: '2026-05-17T09:00:00.000Z',
      created_by: 'admin-1',
      group_id: 'group-2',
      id: 'zone-a',
      is_active: false,
      latitude: 4.63,
      longitude: -74.05,
      name: 'Alpha',
      radius_meters: 90,
    },
  ];
}

function createEventRows(): LocationEventRow[] {
  return [
    {
      distance_meters: 18,
      event_type: 'enter',
      id: 'event-1',
      latitude: 4.61,
      longitude: -74.08,
      triggered_at: '2026-05-17T12:00:00.000Z',
      user_id: 'user-1',
      zone_id: 'zone-a',
    },
  ];
}

function getZoneRowAt(index: number): ZoneRow {
  const zone = createZoneRows()[index];

  if (zone === undefined) {
    throw new Error(`Expected zone at index ${index}.`);
  }

  return zone;
}

describe('mapGeofencingWorkspaceSnapshot', () => {
  it('maps admin snapshot data into truthful zone and event views', () => {
    const snapshot = mapGeofencingWorkspaceSnapshot({
      appliedFilters: {
        eventType: 'enter',
        groupId: 'group-2',
        isAdminFilterable: true,
        userId: 'user-1',
      },
      alexaTriggers: [
        {
          alexa_device_id: 'device-1',
          id: 'trigger-1',
          is_active: true,
          message_template: 'Welcome home',
          zone_id: 'zone-a',
        } satisfies AlexaTriggerRow,
      ],
      eventProfiles: [
        {
          avatar_url: null,
          created_at: '2026-05-17T08:00:00.000Z',
          display_name: 'Ana Ops',
          id: 'user-1',
          is_active: true,
          role: 'user',
          theme_preference: 'ares',
        } satisfies ProfileRow,
      ],
      filterOptions: {
        groups: [{ id: 'group-2', name: 'North Squad' }],
        users: [{ displayName: 'Ana Ops', groupId: 'group-2', id: 'user-1' }],
      },
      fetchedAt: '2026-05-17T12:30:00.000Z',
      groups: [
        {
          created_at: '2026-05-17T07:00:00.000Z',
          created_by: 'admin-1',
          description: null,
          id: 'group-2',
          name: 'North Squad',
        } satisfies GroupRow,
      ],
      recentEvents: createEventRows(),
      role: 'admin',
      zones: createZoneRows(),
    });

    expect(snapshot.viewerScope).toBe('admin-global');
    expect(snapshot.appliedFilters).toEqual({
      eventType: 'enter',
      groupId: 'group-2',
      isAdminFilterable: true,
      userId: 'user-1',
    });
    expect(snapshot.selectedZoneId).toBe('zone-a');
    expect(snapshot.zones.map((zone) => zone.name)).toEqual(['Alpha', 'Bravo']);
    expect(snapshot.zones[0]).toMatchObject({
      groupName: 'North Squad',
      hasAlexaTrigger: true,
      recentEventCount: 1,
    });
    expect(snapshot.recentEvents[0]).toMatchObject({
      userDisplayName: 'Ana Ops',
      zoneName: 'Alpha',
    });
  });

  it('preserves empty states and missing related rows without inventing replacements', () => {
    const snapshot = mapGeofencingWorkspaceSnapshot({
      appliedFilters: {
        eventType: 'all',
        groupId: null,
        isAdminFilterable: false,
        userId: null,
      },
      alexaTriggers: [],
      eventProfiles: [],
      filterOptions: {
        groups: [],
        users: [],
      },
      fetchedAt: '2026-05-17T12:30:00.000Z',
      groups: [],
      recentEvents: createEventRows(),
      role: 'user',
      zones: createZoneRows(),
    });

    expect(snapshot.viewerScope).toBe('user-self-plus-group-zones');
    expect(snapshot.zones[0]?.groupName).toBeNull();
    expect(snapshot.recentEvents[0]?.userDisplayName).toBeNull();
  });

  it('returns an operational empty snapshot when Supabase has no rows', () => {
    const snapshot = mapGeofencingWorkspaceSnapshot({
      appliedFilters: {
        eventType: 'all',
        groupId: null,
        isAdminFilterable: false,
        userId: null,
      },
      alexaTriggers: [],
      eventProfiles: [],
      filterOptions: {
        groups: [],
        users: [],
      },
      fetchedAt: '2026-05-17T12:30:00.000Z',
      groups: [],
      recentEvents: [],
      role: 'user',
      zones: [],
    });

    expect(snapshot.selectedZoneId).toBeNull();
    expect(snapshot.zones).toEqual([]);
    expect(snapshot.recentEvents).toEqual([]);
  });

  it('keeps counts correct for larger snapshots without changing event meaning', () => {
    const snapshot = mapGeofencingWorkspaceSnapshot({
      appliedFilters: {
        eventType: 'all',
        groupId: 'group-1',
        isAdminFilterable: true,
        userId: null,
      },
      alexaTriggers: [
        {
          alexa_device_id: 'device-1',
          id: 'trigger-1',
          is_active: true,
          message_template: 'Welcome home',
          zone_id: 'zone-a',
        } satisfies AlexaTriggerRow,
      ],
      eventProfiles: [
        {
          avatar_url: null,
          created_at: '2026-05-17T08:00:00.000Z',
          display_name: 'Ana Ops',
          id: 'user-1',
          is_active: true,
          role: 'user',
          theme_preference: 'ares',
        } satisfies ProfileRow,
      ],
      filterOptions: {
        groups: [{ id: 'group-1', name: 'Alpha' }],
        users: [],
      },
      fetchedAt: '2026-05-17T12:30:00.000Z',
      groups: [
        {
          created_at: '2026-05-17T07:00:00.000Z',
          created_by: 'admin-1',
          description: null,
          id: 'group-1',
          name: 'Alpha',
        } satisfies GroupRow,
      ],
      recentEvents: [
        ...createEventRows(),
        {
          distance_meters: 30,
          event_type: 'exit',
          id: 'event-2',
          latitude: 4.62,
          longitude: -74.07,
          triggered_at: '2026-05-17T11:00:00.000Z',
          user_id: 'user-1',
          zone_id: 'zone-a',
        } satisfies LocationEventRow,
      ],
      role: 'admin',
      zones: [getZoneRowAt(1)],
    });

    expect(snapshot.zones[0]?.recentEventCount).toBe(2);
    expect(snapshot.recentEvents.map((event) => event.id)).toEqual(['event-1', 'event-2']);
  });
});
