import type { AlexaTriggerRow, GroupRow, LocationEventRow, ZoneRow } from '@dreyk/shared/types/database';

import type { SharedGeofencingZoneView } from './types';

export interface CreateSharedGeofencingZoneViewsParams {
  alexaTriggers: AlexaTriggerRow[];
  groups: GroupRow[];
  recentEvents: LocationEventRow[];
  zones: ZoneRow[];
}

function createGroupByIdMap(groups: GroupRow[]): Map<string, GroupRow> {
  return new Map(groups.map((group) => [group.id, group]));
}

function createActiveTriggerZoneIdSet(alexaTriggers: AlexaTriggerRow[]): Set<string> {
  return new Set(alexaTriggers.filter((trigger) => trigger.is_active).map((trigger) => trigger.zone_id));
}

function createRecentEventCountByZoneMap(recentEvents: LocationEventRow[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const event of recentEvents) {
    counts.set(event.zone_id, (counts.get(event.zone_id) ?? 0) + 1);
  }

  return counts;
}

export function createSharedGeofencingZoneViews({
  alexaTriggers,
  groups,
  recentEvents,
  zones,
}: CreateSharedGeofencingZoneViewsParams): SharedGeofencingZoneView[] {
  const groupById = createGroupByIdMap(groups);
  const activeTriggerZoneIds = createActiveTriggerZoneIdSet(alexaTriggers);
  const recentEventCountByZone = createRecentEventCountByZoneMap(recentEvents);

  return zones.map((zone) => {
    const group = groupById.get(zone.group_id);

    return {
      createdAt: zone.created_at,
      groupId: zone.group_id,
      groupName: group?.name ?? null,
      hasAlexaTrigger: activeTriggerZoneIds.has(zone.id),
      id: zone.id,
      isActive: zone.is_active,
      latitude: zone.latitude,
      longitude: zone.longitude,
      name: zone.name,
      radiusMeters: zone.radius_meters,
      recentEventCount: recentEventCountByZone.get(zone.id) ?? 0,
    };
  });
}
