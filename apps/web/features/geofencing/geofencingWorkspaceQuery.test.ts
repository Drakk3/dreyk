import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  GroupMemberRow,
  GroupRow,
  LocationEventRow,
  ProfileRow,
  ZoneRow,
} from '@dreyk/shared/types/database';

import { parseGeofencingWorkspaceFilterInput } from './geofencingWorkspaceFilters';
import {
  RECENT_EVENTS_LIMIT,
  getGeofencingWorkspaceSnapshot,
  normalizeGeofencingWorkspaceFilters,
} from './geofencingWorkspaceQuery';

const GROUP_FIXTURES: GroupRow[] = [
  {
    created_at: '2026-05-17T09:00:00.000Z',
    created_by: 'admin-1',
    description: null,
    id: 'group-1',
    name: 'Alpha',
  },
];

const GROUP_MEMBER_FIXTURES: GroupMemberRow[] = [
  {
    group_id: 'group-1',
    id: 'membership-1',
    joined_at: '2026-05-17T09:15:00.000Z',
    user_id: 'user-1',
  },
];

interface MockQueryResult<TData> {
  data: TData[];
  error: Error | null;
}

interface MockQueryCall {
  column: string;
  kind: 'eq' | 'in' | 'limit' | 'order';
  value: string | number | string[];
}

class MockQueryBuilder<TData> implements PromiseLike<MockQueryResult<TData>> {
  public readonly calls: MockQueryCall[] = [];

  public constructor(private readonly result: MockQueryResult<TData>) {}

  public eq(column: string, value: string): MockQueryBuilder<TData> {
    this.calls.push({ column, kind: 'eq', value });
    return this;
  }

  public in(column: string, value: string[]): MockQueryBuilder<TData> {
    this.calls.push({ column, kind: 'in', value });
    return this;
  }

  public limit(value: number): MockQueryBuilder<TData> {
    this.calls.push({ column: 'limit', kind: 'limit', value });
    return this;
  }

  public order(column: string): MockQueryBuilder<TData> {
    this.calls.push({ column, kind: 'order', value: column });
    return this;
  }

  public select(): MockQueryBuilder<TData> {
    return this;
  }

  public then<TResult1 = MockQueryResult<TData>, TResult2 = never>(
    onfulfilled?: ((value: MockQueryResult<TData>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.result).then(onfulfilled, onrejected);
  }
}

const supabaseServerMocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

const ZONE_FIXTURES: ZoneRow[] = [
  {
    created_at: '2026-05-17T10:00:00.000Z',
    created_by: 'admin-1',
    group_id: 'group-1',
    id: 'zone-1',
    is_active: true,
    latitude: 4.61,
    longitude: -74.08,
    name: 'Home',
    radius_meters: 80,
  },
];

const EVENT_FIXTURES: LocationEventRow[] = [
  {
    distance_meters: 18,
    event_type: 'enter',
    id: 'event-1',
    latitude: 4.61,
    longitude: -74.08,
    triggered_at: '2026-05-17T12:00:00.000Z',
    user_id: 'user-1',
    zone_id: 'zone-1',
  },
];

const PROFILE_FIXTURES: ProfileRow[] = [
  {
    avatar_url: null,
    created_at: '2026-05-17T08:00:00.000Z',
    display_name: 'Ana Ops',
    id: 'user-1',
    is_active: true,
    role: 'user',
    theme_preference: 'ares',
  },
];

const ALEXA_TRIGGER_FIXTURES = [
  {
    alexa_device_id: 'device-1',
    id: 'trigger-1',
    is_active: true,
    message_template: 'Welcome home',
    zone_id: 'zone-1',
  },
];

let supabaseBuilders: {
  alexa_triggers: MockQueryBuilder<(typeof ALEXA_TRIGGER_FIXTURES)[number]>;
  group_members: MockQueryBuilder<GroupMemberRow>;
  groups: MockQueryBuilder<GroupRow>;
  location_events: MockQueryBuilder<LocationEventRow>;
  profiles: MockQueryBuilder<ProfileRow>;
  zones: MockQueryBuilder<ZoneRow>;
};

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: supabaseServerMocks.createSupabaseServerClient,
}));

beforeEach(() => {
  supabaseBuilders = {
    alexa_triggers: new MockQueryBuilder({ data: ALEXA_TRIGGER_FIXTURES, error: null }),
    group_members: new MockQueryBuilder({ data: GROUP_MEMBER_FIXTURES, error: null }),
    groups: new MockQueryBuilder({ data: GROUP_FIXTURES, error: null }),
    location_events: new MockQueryBuilder({ data: EVENT_FIXTURES, error: null }),
    profiles: new MockQueryBuilder({ data: PROFILE_FIXTURES, error: null }),
    zones: new MockQueryBuilder({ data: ZONE_FIXTURES, error: null }),
  };

  supabaseServerMocks.createSupabaseServerClient.mockReturnValue({
    from: (table: keyof typeof supabaseBuilders) => supabaseBuilders[table],
  });
});

describe('geofencingWorkspaceFilters', () => {
  it('parses route params into a typed filter input', () => {
    expect(
      parseGeofencingWorkspaceFilterInput({
        event: 'enter',
        group: 'group-1',
        user: ['user-1'],
      }),
    ).toEqual({
      eventType: 'enter',
      groupId: 'group-1',
      userId: null,
    });
  });
});

describe('normalizeGeofencingWorkspaceFilters', () => {
  it('ignores admin filters for non-admins', () => {
    expect(
      normalizeGeofencingWorkspaceFilters({
        filters: {
          eventType: 'exit',
          groupId: 'group-1',
          userId: 'user-1',
        },
        groupMembers: GROUP_MEMBER_FIXTURES,
        groups: GROUP_FIXTURES,
        role: 'user',
      }),
    ).toEqual({
      eventType: 'all',
      groupId: null,
      isAdminFilterable: false,
      userId: null,
    });
  });

  it('drops a user filter when it does not belong to the selected group', () => {
    expect(
      normalizeGeofencingWorkspaceFilters({
        filters: {
          eventType: 'enter',
          groupId: 'group-1',
          userId: 'user-x',
        },
        groupMembers: GROUP_MEMBER_FIXTURES,
        groups: GROUP_FIXTURES,
        role: 'admin',
      }),
    ).toEqual({
      eventType: 'enter',
      groupId: 'group-1',
      isAdminFilterable: true,
      userId: null,
    });
  });
});

describe('getGeofencingWorkspaceSnapshot', () => {
  it('keeps recent event reads bounded and deterministically ordered for admins', async () => {
    const snapshot = await getGeofencingWorkspaceSnapshot({
      filters: {
        eventType: 'enter',
        groupId: 'group-1',
        userId: 'user-1',
      },
      role: 'admin',
      userId: 'admin-1',
    });

    expect(snapshot.appliedFilters).toEqual({
      eventType: 'enter',
      groupId: 'group-1',
      isAdminFilterable: true,
      userId: 'user-1',
    });
    expect(snapshot.filterOptions.users[0]?.displayName).toBe('Ana Ops');
    expect(supabaseBuilders.location_events.calls).toEqual(
      expect.arrayContaining([
        { column: 'triggered_at', kind: 'order', value: 'triggered_at' },
        { column: 'id', kind: 'order', value: 'id' },
        { column: 'limit', kind: 'limit', value: RECENT_EVENTS_LIMIT },
        { column: 'zone_id', kind: 'in', value: ['zone-1'] },
        { column: 'user_id', kind: 'eq', value: 'user-1' },
        { column: 'event_type', kind: 'eq', value: 'enter' },
      ]),
    );
  });
});
