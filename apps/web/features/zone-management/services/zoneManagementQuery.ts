import type { AlexaTriggerRow, GroupRow, LocationEventRow, ZoneRow } from '@dreyk/shared/types/database';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSharedGeofencingZoneViews } from '@/shared/geofencing/geofencingZoneViews';
import { AppError } from '@/shared/lib/errors';

import type { ZoneManagementSnapshot } from '../types';

function createQueryError(message: string, cause: unknown): AppError {
  return new AppError(message, 'zoneManagementQuery', cause);
}

export async function getZoneManagementSnapshot(): Promise<ZoneManagementSnapshot> {
  const supabase = createSupabaseServerClient();
  const [zonesResult, groupsResult] = await Promise.all([
    supabase.from('zones').select('*').order('name', { ascending: true }),
    supabase.from('groups').select('*').order('name', { ascending: true }),
  ]);

  if (zonesResult.error !== null) {
    throw createQueryError('Unable to load persisted zones for admin management.', zonesResult.error);
  }

  if (groupsResult.error !== null) {
    throw createQueryError('Unable to load persisted groups for admin management.', groupsResult.error);
  }

  const zones: ZoneRow[] = zonesResult.data ?? [];
  const groups: GroupRow[] = groupsResult.data ?? [];
  const zoneIds = zones.map((zone) => zone.id);
  const [alexaTriggersResult, recentEventsResult] = await Promise.all([
    zoneIds.length === 0 ? Promise.resolve({ data: [], error: null }) : supabase.from('alexa_triggers').select('*').in('zone_id', zoneIds),
    zoneIds.length === 0 ? Promise.resolve({ data: [], error: null }) : supabase.from('location_events').select('*').in('zone_id', zoneIds),
  ]);

  if (alexaTriggersResult.error !== null) {
    throw createQueryError('Unable to load Alexa trigger metadata for admin zone management.', alexaTriggersResult.error);
  }

  if (recentEventsResult.error !== null) {
    throw createQueryError('Unable to load location event metadata for admin zone management.', recentEventsResult.error);
  }

  const alexaTriggers: AlexaTriggerRow[] = alexaTriggersResult.data ?? [];
  const recentEvents: LocationEventRow[] = recentEventsResult.data ?? [];
  const zoneViews = createSharedGeofencingZoneViews({
    alexaTriggers,
    groups,
    recentEvents,
    zones,
  }).sort((leftZone, rightZone) => leftZone.name.localeCompare(rightZone.name));

  return {
    fetchedAt: new Date().toISOString(),
    groupOptions: groups.map((group) => ({ id: group.id, name: group.name })),
    selectedZoneId: zoneViews[0]?.id ?? null,
    zones: zoneViews,
  };
}
