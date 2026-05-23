import { describe, expect, it } from 'vitest';

import type { AlexaTriggerRow, GroupRow, LocationEventRow, ZoneRow } from '@dreyk/shared/types/database';

import { createSharedGeofencingZoneViews } from '@/shared/geofencing/geofencingZoneViews';

const GROUPS: GroupRow[] = [
  {
    created_at: '2026-05-18T08:00:00.000Z',
    created_by: '11111111-1111-4111-8111-111111111111',
    description: null,
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    name: 'Alpha',
  },
];

const ZONES: ZoneRow[] = [
  {
    created_at: '2026-05-18T09:00:00.000Z',
    created_by: '11111111-1111-4111-8111-111111111111',
    group_id: GROUPS[0]!.id,
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    is_active: true,
    latitude: 4.61,
    longitude: -74.08,
    name: 'Home',
    radius_meters: 120,
  },
];

const TRIGGERS: AlexaTriggerRow[] = [
  {
    alexa_device_id: 'device-1',
    id: 'trigger-1',
    is_active: true,
    message_template: 'Welcome home',
    zone_id: ZONES[0]!.id,
  },
];

const EVENTS: LocationEventRow[] = [
  {
    distance_meters: 10,
    event_type: 'enter',
    id: 'event-1',
    latitude: 4.61,
    longitude: -74.08,
    triggered_at: '2026-05-18T09:10:00.000Z',
    user_id: 'user-1',
    zone_id: ZONES[0]!.id,
  },
  {
    distance_meters: 11,
    event_type: 'exit',
    id: 'event-2',
    latitude: 4.61,
    longitude: -74.08,
    triggered_at: '2026-05-18T09:12:00.000Z',
    user_id: 'user-2',
    zone_id: ZONES[0]!.id,
  },
];

describe('createSharedGeofencingZoneViews', () => {
  it('maps persisted zone rows into reusable read-only views', () => {
    expect(
      createSharedGeofencingZoneViews({
        alexaTriggers: TRIGGERS,
        groups: GROUPS,
        recentEvents: EVENTS,
        zones: ZONES,
      }),
    ).toEqual([
      {
        createdAt: '2026-05-18T09:00:00.000Z',
        groupId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        groupName: 'Alpha',
        hasAlexaTrigger: true,
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        isActive: true,
        latitude: 4.61,
        longitude: -74.08,
        name: 'Home',
        radiusMeters: 120,
        recentEventCount: 2,
      },
    ]);
  });
});
