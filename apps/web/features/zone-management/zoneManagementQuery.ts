import type {
  AlexaDeliveryAttemptRow,
  AlexaLinkedUserRow,
  AlexaTriggerRow,
  GroupRow,
  LocationEventRow,
  ZoneRow,
} from '@dreyk/shared/types/database';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSharedGeofencingZoneViews } from '@/shared/geofencing/geofencingZoneViews';
import { AppError, handleError } from '@/shared/lib/errors';

import type { ZoneManagementSnapshot } from './types';

function createQueryError(message: string, cause: unknown): AppError {
  return new AppError(message, 'zoneManagementQuery', cause);
}

interface EmptyResult<TRow> {
  data: TRow[];
  error: null;
}

function createEmptyResult<TRow>(): EmptyResult<TRow> {
  return { data: [], error: null };
}

export async function getZoneManagementSnapshot(): Promise<ZoneManagementSnapshot> {
  try {
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
      zoneIds.length === 0 ? Promise.resolve(createEmptyResult<AlexaTriggerRow>()) : supabase.from('alexa_triggers').select('*').in('zone_id', zoneIds),
      zoneIds.length === 0 ? Promise.resolve(createEmptyResult<LocationEventRow>()) : supabase.from('location_events').select('*').in('zone_id', zoneIds),
    ]);

    if (alexaTriggersResult.error !== null) {
      throw createQueryError('Unable to load Alexa trigger metadata for admin zone management.', alexaTriggersResult.error);
    }

    if (recentEventsResult.error !== null) {
      throw createQueryError('Unable to load location event metadata for admin zone management.', recentEventsResult.error);
    }

    const alexaTriggers: AlexaTriggerRow[] = alexaTriggersResult.data ?? [];
    const linkedUserIds = Array.from(
      new Set(alexaTriggers.map((trigger) => trigger.linked_user_id).filter((linkedUserId): linkedUserId is string => linkedUserId !== null)),
    );
    const triggerIds = alexaTriggers.map((trigger) => trigger.id);
    const [alexaLinkedUsersResult, alexaDeliveryAttemptsResult] = await Promise.all([
      linkedUserIds.length === 0
        ? Promise.resolve(createEmptyResult<AlexaLinkedUserRow>())
        : supabase.from('alexa_linked_users').select('*').in('id', linkedUserIds),
      triggerIds.length === 0
        ? Promise.resolve(createEmptyResult<AlexaDeliveryAttemptRow>())
        : supabase.from('alexa_delivery_attempts').select('*').in('alexa_trigger_id', triggerIds),
    ]);

    if (alexaLinkedUsersResult.error !== null) {
      throw createQueryError('Unable to load Alexa linked-user readiness for admin zone management.', alexaLinkedUsersResult.error);
    }

    if (alexaDeliveryAttemptsResult.error !== null) {
      throw createQueryError('Unable to load Alexa delivery attempts for admin zone management.', alexaDeliveryAttemptsResult.error);
    }

    const alexaLinkedUsers: AlexaLinkedUserRow[] = alexaLinkedUsersResult.data ?? [];
    const alexaDeliveryAttempts: AlexaDeliveryAttemptRow[] = alexaDeliveryAttemptsResult.data ?? [];
    const recentEvents: LocationEventRow[] = recentEventsResult.data ?? [];
    const zoneViews = createSharedGeofencingZoneViews({
      alexaDeliveryAttempts,
      alexaLinkedUsers,
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
  } catch (error: unknown) {
    handleError(error, 'zoneManagementQuery.getZoneManagementSnapshot');

    if (error instanceof AppError) {
      throw error;
    }

    throw createQueryError('Unable to build the admin zone management snapshot.', error);
  }
}
