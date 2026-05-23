import { describe, expect, it } from 'vitest';

import type { GeofencingWorkspaceSnapshot } from '../types';

import {
  createGeofencingWorkspaceStoreState,
  reduceGeofencingWorkspaceStoreState,
} from './geofencingWorkspaceStore';

function createSnapshot(selectedZoneId: string | null): GeofencingWorkspaceSnapshot {
  return {
    appliedFilters: {
      eventType: 'all',
      groupId: null,
      isAdminFilterable: false,
      userId: null,
    },
    filterOptions: {
      groups: [],
      users: [],
    },
    fetchedAt: '2026-05-17T12:00:00.000Z',
    recentEvents: [],
    selectedZoneId,
    viewerScope: 'user-self-plus-group-zones',
    zones: [
      {
        createdAt: '2026-05-17T10:00:00.000Z',
        groupId: 'group-1',
        groupName: 'Alpha',
        hasAlexaTrigger: false,
        id: 'zone-1',
        isActive: true,
        latitude: 4.61,
        longitude: -74.08,
        name: 'Home',
        radiusMeters: 80,
        recentEventCount: 0,
      },
      {
        createdAt: '2026-05-17T10:00:00.000Z',
        groupId: 'group-1',
        groupName: 'Alpha',
        hasAlexaTrigger: false,
        id: 'zone-2',
        isActive: true,
        latitude: 4.62,
        longitude: -74.07,
        name: 'Office',
        radiusMeters: 90,
        recentEventCount: 0,
      },
    ],
  };
}

describe('geofencingWorkspaceStore', () => {
  it('uses the server-selected zone when it is valid', () => {
    const state = createGeofencingWorkspaceStoreState(createSnapshot('zone-2'));

    expect(state.selectedZoneId).toBe('zone-2');
  });

  it('falls back to the first zone when the selected zone is missing', () => {
    const state = createGeofencingWorkspaceStoreState(createSnapshot('missing-zone'));

    expect(state.selectedZoneId).toBe('zone-1');
  });

  it('keeps the current selection when syncing a snapshot that still contains the selected zone', () => {
    const initialState = createGeofencingWorkspaceStoreState(createSnapshot('zone-1'));
    const nextState = reduceGeofencingWorkspaceStoreState(initialState, {
      snapshot: createSnapshot('zone-2'),
      type: 'syncSnapshot',
    });

    expect(nextState.selectedZoneId).toBe('zone-1');
  });
});
