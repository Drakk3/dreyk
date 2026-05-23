import { describe, expect, it } from 'vitest';

import type { ZoneManagementSnapshot } from '../types';

import { createZoneManagementStoreState, reduceZoneManagementStoreState } from './zoneManagementStore';

function createSnapshot(): ZoneManagementSnapshot {
  return {
    fetchedAt: '2026-05-18T10:00:00.000Z',
    groupOptions: [{ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Alpha' }],
    selectedZoneId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    zones: [
      {
        createdAt: '2026-05-18T09:00:00.000Z',
        groupId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        groupName: 'Alpha',
        hasAlexaTrigger: false,
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        isActive: true,
        latitude: 4.61,
        longitude: -74.08,
        name: 'Home',
        radiusMeters: 120,
        recentEventCount: 0,
      },
      {
        createdAt: '2026-05-18T09:10:00.000Z',
        groupId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        groupName: 'Alpha',
        hasAlexaTrigger: false,
        id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        isActive: false,
        latitude: 4.62,
        longitude: -74.07,
        name: 'Office',
        radiusMeters: 80,
        recentEventCount: 0,
      },
    ],
  };
}

describe('zoneManagementStore', () => {
  it('resets to a create draft when the admin starts a new zone', () => {
    const snapshot = createSnapshot();
    const state = createZoneManagementStoreState(snapshot);

    const nextState = reduceZoneManagementStoreState(
      state,
      { defaultGroupId: snapshot.groupOptions[0]!.id, type: 'startCreate' },
      snapshot,
    );

    expect(nextState.mode).toBe('create');
    expect(nextState.draft.name).toBe('');
    expect(nextState.draft.groupId).toBe(snapshot.groupOptions[0]!.id);
  });

  it('falls back to the next available zone after a delete refresh removes the selection', () => {
    const snapshot = createSnapshot();
    const state = createZoneManagementStoreState(snapshot);
    const refreshedSnapshot: ZoneManagementSnapshot = {
      ...snapshot,
      selectedZoneId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      zones: [snapshot.zones[1]!],
    };

    const nextState = reduceZoneManagementStoreState(state, { snapshot: refreshedSnapshot, type: 'syncSnapshot' }, refreshedSnapshot);

    expect(nextState.selectedZoneId).toBe('cccccccc-cccc-4ccc-8ccc-cccccccccccc');
    expect(nextState.mode).toBe('edit');
    expect(nextState.draft.name).toBe('Office');
  });
});
