import type { SharedGeofencingZoneView } from '@/shared/geofencing/types';

import type { ZoneFormValues, ZoneManagementSnapshot } from '../types';

import { createEmptyZoneFormValues, mapZoneToFormValues } from '../services/zoneManagementPayloads';

export interface ZoneManagementStoreState {
  draft: ZoneFormValues;
  mode: 'create' | 'edit';
  pendingDeleteZoneId: string | null;
  selectedZoneId: string | null;
}

export interface SelectZoneAction {
  selectedZoneId: string | null;
  type: 'selectZone';
}

export interface StartCreateAction {
  defaultGroupId: string | null;
  type: 'startCreate';
}

export interface UpdateDraftFieldAction {
  field: keyof ZoneFormValues;
  type: 'updateDraftField';
  value: boolean | string;
}

export interface OpenDeleteConfirmationAction {
  zoneId: string;
  type: 'openDeleteConfirmation';
}

export interface CloseDeleteConfirmationAction {
  type: 'closeDeleteConfirmation';
}

export interface SyncSnapshotAction {
  snapshot: ZoneManagementSnapshot;
  type: 'syncSnapshot';
}

export type ZoneManagementStoreAction =
  | CloseDeleteConfirmationAction
  | OpenDeleteConfirmationAction
  | SelectZoneAction
  | StartCreateAction
  | SyncSnapshotAction
  | UpdateDraftFieldAction;

function resolveSafeSelectedZoneId(snapshot: ZoneManagementSnapshot, currentSelectedZoneId: string | null): string | null {
  if (snapshot.zones.length === 0) {
    return null;
  }

  if (currentSelectedZoneId !== null && snapshot.zones.some((zone) => zone.id === currentSelectedZoneId)) {
    return currentSelectedZoneId;
  }

  if (snapshot.selectedZoneId !== null && snapshot.zones.some((zone) => zone.id === snapshot.selectedZoneId)) {
    return snapshot.selectedZoneId;
  }

  return snapshot.zones[0]?.id ?? null;
}

function findZone(snapshot: ZoneManagementSnapshot, selectedZoneId: string | null): SharedGeofencingZoneView | null {
  if (selectedZoneId === null) {
    return null;
  }

  return snapshot.zones.find((zone) => zone.id === selectedZoneId) ?? null;
}

export function createZoneManagementStoreState(snapshot: ZoneManagementSnapshot): ZoneManagementStoreState {
  const selectedZoneId = resolveSafeSelectedZoneId(snapshot, null);
  const selectedZone = findZone(snapshot, selectedZoneId);

  return {
    draft: selectedZone === null ? createEmptyZoneFormValues(snapshot.groupOptions[0]?.id ?? null) : mapZoneToFormValues(selectedZone),
    mode: selectedZone === null ? 'create' : 'edit',
    pendingDeleteZoneId: null,
    selectedZoneId,
  };
}

export function reduceZoneManagementStoreState(
  state: ZoneManagementStoreState,
  action: ZoneManagementStoreAction,
  snapshot: ZoneManagementSnapshot,
): ZoneManagementStoreState {
  if (action.type === 'startCreate') {
    return {
      draft: createEmptyZoneFormValues(action.defaultGroupId),
      mode: 'create',
      pendingDeleteZoneId: null,
      selectedZoneId: state.selectedZoneId,
    };
  }

  if (action.type === 'selectZone') {
    const selectedZone = findZone(snapshot, action.selectedZoneId);

    return {
      draft: selectedZone === null ? state.draft : mapZoneToFormValues(selectedZone),
      mode: selectedZone === null ? state.mode : 'edit',
      pendingDeleteZoneId: null,
      selectedZoneId: action.selectedZoneId,
    };
  }

  if (action.type === 'updateDraftField') {
    return {
      ...state,
      draft: {
        ...state.draft,
        [action.field]: action.value,
      },
    };
  }

  if (action.type === 'openDeleteConfirmation') {
    return {
      ...state,
      pendingDeleteZoneId: action.zoneId,
    };
  }

  if (action.type === 'closeDeleteConfirmation') {
    return {
      ...state,
      pendingDeleteZoneId: null,
    };
  }

  const selectedZoneId = resolveSafeSelectedZoneId(action.snapshot, state.selectedZoneId);
  const selectedZone = findZone(action.snapshot, selectedZoneId);

  if (state.mode === 'create') {
    return {
      ...state,
      pendingDeleteZoneId: null,
      selectedZoneId,
    };
  }

  return {
    draft: selectedZone === null ? createEmptyZoneFormValues(action.snapshot.groupOptions[0]?.id ?? null) : mapZoneToFormValues(selectedZone),
    mode: selectedZone === null ? 'create' : 'edit',
    pendingDeleteZoneId: null,
    selectedZoneId,
  };
}
