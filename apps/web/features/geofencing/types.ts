import type { EventType } from '@dreyk/shared/types/database';

import type { SharedGeofencingEventView, SharedGeofencingZoneView } from '@/shared/geofencing/types';

export type GeofencingWorkspaceViewerScope = 'admin-global' | 'user-self-plus-group-zones';

export type GeofencingEventFilter = 'all' | EventType;

export type GeofencingPanelFocus = 'workspace' | 'zones' | 'events' | 'coverage' | 'snapshot' | 'access';

export type GeofencingZoneView = SharedGeofencingZoneView;

export type GeofencingEventView = SharedGeofencingEventView;

export interface GeofencingWorkspaceFilterInput {
  eventType: GeofencingEventFilter;
  groupId: string | null;
  userId: string | null;
}

export interface GeofencingWorkspaceAppliedFilters extends GeofencingWorkspaceFilterInput {
  isAdminFilterable: boolean;
}

export interface GeofencingWorkspaceGroupFilterOption {
  id: string;
  name: string;
}

export interface GeofencingWorkspaceUserFilterOption {
  displayName: string;
  groupId: string;
  id: string;
}

export interface GeofencingWorkspaceFilterOptions {
  groups: GeofencingWorkspaceGroupFilterOption[];
  users: GeofencingWorkspaceUserFilterOption[];
}

export interface GeofencingWorkspaceSnapshot {
  appliedFilters: GeofencingWorkspaceAppliedFilters;
  filterOptions: GeofencingWorkspaceFilterOptions;
  fetchedAt: string;
  recentEvents: GeofencingEventView[];
  selectedZoneId: string | null;
  viewerScope: GeofencingWorkspaceViewerScope;
  zones: GeofencingZoneView[];
}

export interface GeofencingWorkspaceSummary {
  activeZonesCount: number;
  totalEventsCount: number;
  totalZonesCount: number;
}
