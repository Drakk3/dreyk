'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

import type {
  GeofencingPanelFocus,
  GeofencingWorkspaceSnapshot,
  GeofencingWorkspaceSummary,
  GeofencingZoneView,
} from '../types';
import {
  createGeofencingWorkspaceStoreState,
  reduceGeofencingWorkspaceStoreState,
} from '../store/geofencingWorkspaceStore';

interface UseGeofencingWorkspaceResult {
  appliedFilters: GeofencingWorkspaceSnapshot['appliedFilters'];
  filterStatusCopy: string;
  filterOptions: GeofencingWorkspaceSnapshot['filterOptions'];
  handlePanelFocusChange: (panelFocus: GeofencingPanelFocus) => void;
  handleSetEventTypeFilter: (eventType: GeofencingWorkspaceSnapshot['appliedFilters']['eventType']) => void;
  handleSetGroupFilter: (groupId: string | null) => void;
  handleSelectZone: (selectedZoneId: string | null) => void;
  handleSetUserFilter: (userId: string | null) => void;
  isAdminFilterable: boolean;
  panelFocus: GeofencingPanelFocus;
  recentEvents: GeofencingWorkspaceSnapshot['recentEvents'];
  selectedZone: GeofencingZoneView | null;
  selectedZoneId: string | null;
  statusLabel: string;
  summary: GeofencingWorkspaceSummary;
}

function buildFilterStatusCopy(snapshot: GeofencingWorkspaceSnapshot): string {
  if (!snapshot.appliedFilters.isAdminFilterable) {
    return 'Access policy decides the snapshot. URL admin filters are ignored for non-admins.';
  }

  return snapshot.appliedFilters.groupId === null
    ? 'Admin filters are URL-backed. Pick a group to unlock user-level slicing.'
    : `Admin filters are server-truthful. Current group ${snapshot.appliedFilters.groupId} with event ${snapshot.appliedFilters.eventType}.`;
}

function buildStatusLabel(
  appliedFilters: GeofencingWorkspaceSnapshot['appliedFilters'],
  viewerScope: GeofencingWorkspaceSnapshot['viewerScope'],
): string {
  return appliedFilters.isAdminFilterable
    ? 'ADMIN GLOBAL / READ ONLY'
    : viewerScope === 'user-self-plus-group-zones'
      ? 'GROUP ZONES + MY EVENTS / READ ONLY'
      : 'READ ONLY';
}

function updateWorkspaceFilters(
  pathname: string,
  router: ReturnType<typeof useRouter>,
  searchParams: ReturnType<typeof useSearchParams>,
  nextFilters: GeofencingWorkspaceSnapshot['appliedFilters'],
): void {
  const nextSearchParams = new URLSearchParams(searchParams.toString());

  if (nextFilters.groupId === null) {
    nextSearchParams.delete('group');
    nextSearchParams.delete('user');
  } else {
    nextSearchParams.set('group', nextFilters.groupId);

    if (nextFilters.userId === null) {
      nextSearchParams.delete('user');
    } else {
      nextSearchParams.set('user', nextFilters.userId);
    }
  }

  if (nextFilters.eventType === 'all') {
    nextSearchParams.delete('event');
  } else {
    nextSearchParams.set('event', nextFilters.eventType);
  }

  const nextQuery = nextSearchParams.toString();
  router.replace(nextQuery.length > 0 ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
}

export function useGeofencingWorkspace(snapshot: GeofencingWorkspaceSnapshot): UseGeofencingWorkspaceResult {
  // 1. External dependencies (store, router, clients)
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 2. Local state
  const [state, dispatch] = React.useReducer(
    reduceGeofencingWorkspaceStoreState,
    snapshot,
    createGeofencingWorkspaceStoreState,
  );

  // 3. Derived values (useMemo)
  const selectedZone = React.useMemo<GeofencingZoneView | null>(() => {
    return snapshot.zones.find((zone) => zone.id === state.selectedZoneId) ?? null;
  }, [snapshot.zones, state.selectedZoneId]);

  const summary = React.useMemo<GeofencingWorkspaceSummary>(() => {
    return {
      activeZonesCount: snapshot.zones.filter((zone) => zone.isActive).length,
      totalEventsCount: snapshot.recentEvents.length,
      totalZonesCount: snapshot.zones.length,
    };
  }, [snapshot.recentEvents.length, snapshot.zones]);

  const filterStatusCopy = React.useMemo<string>(() => {
    return buildFilterStatusCopy(snapshot);
  }, [snapshot]);

  const statusLabel = React.useMemo<string>(() => {
    return buildStatusLabel(snapshot.appliedFilters, snapshot.viewerScope);
  }, [snapshot.appliedFilters, snapshot.viewerScope]);

  // 4. Handlers and effects (useCallback, useEffect)
  React.useEffect(() => {
    dispatch({ snapshot, type: 'syncSnapshot' });
  }, [snapshot]);

  const handlePanelFocusChange = React.useCallback((panelFocus: GeofencingPanelFocus): void => {
    dispatch({ panelFocus, type: 'setPanelFocus' });
  }, []);

  const handleSelectZone = React.useCallback((selectedZoneId: string | null): void => {
    dispatch({ selectedZoneId, type: 'setSelectedZone' });
  }, []);

  const handleSetGroupFilter = React.useCallback(
    (groupId: string | null): void => {
      updateWorkspaceFilters(pathname, router, searchParams, {
        ...snapshot.appliedFilters,
        groupId,
        userId: null,
      });
    },
    [pathname, router, searchParams, snapshot.appliedFilters],
  );

  const handleSetUserFilter = React.useCallback(
    (userId: string | null): void => {
      updateWorkspaceFilters(pathname, router, searchParams, {
        ...snapshot.appliedFilters,
        userId,
      });
    },
    [pathname, router, searchParams, snapshot.appliedFilters],
  );

  const handleSetEventTypeFilter = React.useCallback(
    (eventType: GeofencingWorkspaceSnapshot['appliedFilters']['eventType']): void => {
      updateWorkspaceFilters(pathname, router, searchParams, {
        ...snapshot.appliedFilters,
        eventType,
      });
    },
    [pathname, router, searchParams, snapshot.appliedFilters],
  );

  // 5. Single return object — NEVER return an array from a hook
  return {
    appliedFilters: snapshot.appliedFilters,
    filterStatusCopy,
    filterOptions: snapshot.filterOptions,
    handlePanelFocusChange,
    handleSetEventTypeFilter,
    handleSetGroupFilter,
    handleSelectZone,
    handleSetUserFilter,
    isAdminFilterable: snapshot.appliedFilters.isAdminFilterable,
    panelFocus: state.panelFocus,
    recentEvents: snapshot.recentEvents,
    selectedZone,
    selectedZoneId: state.selectedZoneId,
    statusLabel,
    summary,
  };
}
