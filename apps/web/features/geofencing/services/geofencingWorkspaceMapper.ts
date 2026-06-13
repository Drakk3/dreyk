import type {
  AlexaDeliveryAttemptRow,
  AlexaLinkedUserRow,
  AlexaTriggerRow,
  GroupRow,
  LocationEventRow,
  ProfileRow,
  Role,
  ZoneRow,
} from '@dreyk/shared/types/database';

import type {
  GeofencingEventView,
  GeofencingWorkspaceAppliedFilters,
  GeofencingWorkspaceFilterOptions,
  GeofencingWorkspaceSnapshot,
  GeofencingZoneView,
} from '../types';

import { createSharedGeofencingZoneViews } from '@/shared/geofencing/geofencingZoneViews';

export interface GeofencingWorkspaceQueryResult {
  appliedFilters: GeofencingWorkspaceAppliedFilters;
  alexaDeliveryAttempts: AlexaDeliveryAttemptRow[];
  alexaLinkedUsers: AlexaLinkedUserRow[];
  alexaTriggers: AlexaTriggerRow[];
  eventProfiles: ProfileRow[];
  filterOptions: GeofencingWorkspaceFilterOptions;
  fetchedAt: string;
  groups: GroupRow[];
  recentEvents: LocationEventRow[];
  role: Role;
  zones: ZoneRow[];
}

function createProfileByIdMap(eventProfiles: ProfileRow[]): Map<string, ProfileRow> {
  return new Map(eventProfiles.map((profile) => [profile.id, profile]));
}

function mapZoneViews(result: GeofencingWorkspaceQueryResult): GeofencingZoneView[] {
  return createSharedGeofencingZoneViews({
    alexaDeliveryAttempts: result.alexaDeliveryAttempts,
    alexaLinkedUsers: result.alexaLinkedUsers,
    alexaTriggers: result.alexaTriggers,
    groups: result.groups,
    recentEvents: result.recentEvents,
    zones: result.zones,
  });
}

function mapEventViews(result: GeofencingWorkspaceQueryResult, zones: GeofencingZoneView[]): GeofencingEventView[] {
  const zoneById = new Map(zones.map((zone) => [zone.id, zone]));
  const profileById = createProfileByIdMap(result.eventProfiles);

  return result.recentEvents.map((event) => {
    const zone = zoneById.get(event.zone_id);
    const profile = profileById.get(event.user_id);

    return {
      distanceMeters: event.distance_meters,
      eventType: event.event_type,
      id: event.id,
      latitude: event.latitude,
      longitude: event.longitude,
      triggeredAt: event.triggered_at,
      userDisplayName: profile?.display_name ?? null,
      userId: event.user_id,
      zoneId: event.zone_id,
      zoneName: zone?.name ?? null,
    };
  });
}

export function mapGeofencingWorkspaceSnapshot(result: GeofencingWorkspaceQueryResult): GeofencingWorkspaceSnapshot {
  const zones = mapZoneViews(result).sort((leftZone, rightZone) => leftZone.name.localeCompare(rightZone.name));
  const recentEvents = mapEventViews(result, zones);

  return {
    appliedFilters: result.appliedFilters,
    filterOptions: result.filterOptions,
    fetchedAt: result.fetchedAt,
    recentEvents,
    selectedZoneId: zones[0]?.id ?? null,
    viewerScope: result.role === 'admin' ? 'admin-global' : 'user-self-plus-group-zones',
    zones,
  };
}
