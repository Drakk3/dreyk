import type { GeofencingPanelFocus, GeofencingWorkspaceSnapshot } from '../types';

export interface GeofencingWorkspaceStoreState {
  panelFocus: GeofencingPanelFocus;
  selectedZoneId: string | null;
}

export interface SetPanelFocusAction {
  panelFocus: GeofencingPanelFocus;
  type: 'setPanelFocus';
}

export interface SetSelectedZoneAction {
  selectedZoneId: string | null;
  type: 'setSelectedZone';
}

export interface SyncSnapshotAction {
  snapshot: GeofencingWorkspaceSnapshot;
  type: 'syncSnapshot';
}

export type GeofencingWorkspaceStoreAction =
  | SetPanelFocusAction
  | SetSelectedZoneAction
  | SyncSnapshotAction;

export const INITIAL_GEOFENCING_WORKSPACE_STORE_STATE: GeofencingWorkspaceStoreState = {
  panelFocus: 'workspace',
  selectedZoneId: null,
};

function resolveSafeSelectedZoneId(snapshot: GeofencingWorkspaceSnapshot, currentSelectedZoneId: string | null): string | null {
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

export function createGeofencingWorkspaceStoreState(snapshot: GeofencingWorkspaceSnapshot): GeofencingWorkspaceStoreState {
  return {
    panelFocus: 'workspace',
    selectedZoneId: resolveSafeSelectedZoneId(snapshot, null),
  };
}

export function reduceGeofencingWorkspaceStoreState(
  state: GeofencingWorkspaceStoreState,
  action: GeofencingWorkspaceStoreAction,
): GeofencingWorkspaceStoreState {
  if (action.type === 'setPanelFocus') {
    return {
      ...state,
      panelFocus: action.panelFocus,
    };
  }

  if (action.type === 'setSelectedZone') {
    return {
      ...state,
      panelFocus: 'zones',
      selectedZoneId: action.selectedZoneId,
    };
  }

  return {
    ...state,
    selectedZoneId: resolveSafeSelectedZoneId(action.snapshot, state.selectedZoneId),
  };
}
