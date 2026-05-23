import type {
  GeofencingWorkspaceAppliedFilters,
  GeofencingWorkspaceFilterInput,
  GeofencingWorkspaceFilterOptions,
  GeofencingWorkspaceSnapshot,
} from './types';

import type {
  AlexaTriggerRow,
  GroupMemberRow,
  GroupRow,
  LocationEventRow,
  ProfileRow,
  Role,
  ZoneRow,
} from '@dreyk/shared/types/database';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AppError, handleError } from '@/shared/lib/errors';

import { createDefaultGeofencingWorkspaceFilterInput } from './services/geofencingWorkspaceFilters';
import { mapGeofencingWorkspaceSnapshot } from './services/geofencingWorkspaceMapper';

const RECENT_EVENTS_LIMIT = 25;

export interface GetGeofencingWorkspaceSnapshotParams {
  filters?: GeofencingWorkspaceFilterInput;
  role: Role;
  userId: string;
}

interface NormalizeGeofencingWorkspaceFiltersParams {
  filters: GeofencingWorkspaceFilterInput;
  groupMembers: GroupMemberRow[];
  groups: GroupRow[];
  role: Role;
}

function createEmptyFilterOptions(): GeofencingWorkspaceFilterOptions {
  return {
    groups: [],
    users: [],
  };
}

function createNonAdminAppliedFilters(): GeofencingWorkspaceAppliedFilters {
  return {
    eventType: 'all',
    groupId: null,
    isAdminFilterable: false,
    userId: null,
  };
}

function createGroupMembersByGroupMap(groupMembers: GroupMemberRow[]): Map<string, Set<string>> {
  const membersByGroup = new Map<string, Set<string>>();

  for (const groupMember of groupMembers) {
    const members = membersByGroup.get(groupMember.group_id) ?? new Set<string>();
    members.add(groupMember.user_id);
    membersByGroup.set(groupMember.group_id, members);
  }

  return membersByGroup;
}

export function normalizeGeofencingWorkspaceFilters({
  filters,
  groupMembers,
  groups,
  role,
}: NormalizeGeofencingWorkspaceFiltersParams): GeofencingWorkspaceAppliedFilters {
  if (role !== 'admin') {
    return createNonAdminAppliedFilters();
  }

  const groupIds = new Set(groups.map((group) => group.id));
  const normalizedGroupId = filters.groupId !== null && groupIds.has(filters.groupId) ? filters.groupId : null;
  const membersByGroup = createGroupMembersByGroupMap(groupMembers);
  const allowedUserIds = normalizedGroupId === null ? null : membersByGroup.get(normalizedGroupId) ?? new Set<string>();
  const normalizedUserId =
    normalizedGroupId !== null && filters.userId !== null && allowedUserIds?.has(filters.userId) === true ? filters.userId : null;

  return {
    eventType: filters.eventType,
    groupId: normalizedGroupId,
    isAdminFilterable: true,
    userId: normalizedUserId,
  };
}

function createGeofencingWorkspaceFilterOptions(
  appliedFilters: GeofencingWorkspaceAppliedFilters,
  groups: GroupRow[],
  groupMembers: GroupMemberRow[],
  memberProfiles: ProfileRow[],
): GeofencingWorkspaceFilterOptions {
  if (!appliedFilters.isAdminFilterable) {
    return createEmptyFilterOptions();
  }

  const profileById = new Map(memberProfiles.map((profile) => [profile.id, profile]));
  const userOptions =
    appliedFilters.groupId === null
      ? []
      : groupMembers
          .filter((groupMember) => groupMember.group_id === appliedFilters.groupId)
          .map((groupMember) => {
            const profile = profileById.get(groupMember.user_id);

            return {
              displayName: profile?.display_name ?? 'Unavailable user',
              groupId: groupMember.group_id,
              id: groupMember.user_id,
            };
          })
          .sort((leftUser, rightUser) => leftUser.displayName.localeCompare(rightUser.displayName));

  return {
    groups: groups
      .map((group) => ({
        id: group.id,
        name: group.name,
      }))
      .sort((leftGroup, rightGroup) => leftGroup.name.localeCompare(rightGroup.name)),
    users: userOptions,
  };
}

function createQueryError(message: string, cause: unknown): AppError {
  return new AppError(message, 'geofencingWorkspaceQuery', cause);
}

export async function getGeofencingWorkspaceSnapshot({ filters, role, userId }: GetGeofencingWorkspaceSnapshotParams): Promise<GeofencingWorkspaceSnapshot> {
  try {
    const supabase = createSupabaseServerClient();
    const requestedFilters = filters ?? createDefaultGeofencingWorkspaceFilterInput();
    void userId;

    const zonesResult = await supabase.from('zones').select('*').order('name', { ascending: true });

    if (zonesResult.error !== null) {
      throw createQueryError('Unable to load zones for the geofencing workspace.', zonesResult.error);
    }

    const zones: ZoneRow[] = zonesResult.data ?? [];
    const groupIds = Array.from(new Set(zones.map((zone) => zone.group_id)));

    const [groupsResult, groupMembersResult] = await Promise.all([
      groupIds.length === 0
        ? Promise.resolve({ data: [], error: null })
        : supabase.from('groups').select('*').in('id', groupIds).order('name', { ascending: true }),
      role !== 'admin' || groupIds.length === 0
        ? Promise.resolve({ data: [], error: null })
        : supabase.from('group_members').select('*').in('group_id', groupIds),
    ]);

    if (groupsResult.error !== null) {
      throw createQueryError('Unable to load group metadata for the geofencing workspace.', groupsResult.error);
    }

    if (groupMembersResult.error !== null) {
      throw createQueryError('Unable to load group membership metadata for the geofencing workspace.', groupMembersResult.error);
    }

    const groups: GroupRow[] = groupsResult.data ?? [];
    const groupMembers: GroupMemberRow[] = groupMembersResult.data ?? [];
    const appliedFilters = normalizeGeofencingWorkspaceFilters({
      filters: requestedFilters,
      groupMembers,
      groups,
      role,
    });
    const filteredZones = appliedFilters.groupId === null ? zones : zones.filter((zone) => zone.group_id === appliedFilters.groupId);
    const filteredZoneIds = filteredZones.map((zone) => zone.id);

    const [alexaTriggersResult, memberProfilesResult, recentEventsResult] = await Promise.all([
      filteredZoneIds.length === 0
        ? Promise.resolve({ data: [], error: null })
        : supabase.from('alexa_triggers').select('*').in('zone_id', filteredZoneIds),
      role !== 'admin' || groupMembers.length === 0
        ? Promise.resolve({ data: [], error: null })
        : supabase
            .from('profiles')
            .select('*')
            .in(
              'id',
              Array.from(new Set(groupMembers.map((groupMember) => groupMember.user_id))),
            ),
      filteredZoneIds.length === 0 && appliedFilters.groupId !== null
        ? Promise.resolve({ data: [], error: null })
        : (() => {
            let query = supabase
              .from('location_events')
              .select('*')
              .order('triggered_at', { ascending: false })
              .order('id', { ascending: false })
              .limit(RECENT_EVENTS_LIMIT);

            if (appliedFilters.groupId !== null) {
              query = query.in('zone_id', filteredZoneIds);
            }

            if (appliedFilters.userId !== null) {
              query = query.eq('user_id', appliedFilters.userId);
            }

            if (appliedFilters.eventType !== 'all') {
              query = query.eq('event_type', appliedFilters.eventType);
            }

            return query;
          })(),
    ]);

    if (alexaTriggersResult.error !== null) {
      throw createQueryError('Unable to load Alexa trigger metadata for the geofencing workspace.', alexaTriggersResult.error);
    }

    if (memberProfilesResult.error !== null) {
      throw createQueryError('Unable to load member profile metadata for the geofencing workspace.', memberProfilesResult.error);
    }

    if (recentEventsResult.error !== null) {
      throw createQueryError('Unable to load recent geofencing events.', recentEventsResult.error);
    }

    const recentEvents: LocationEventRow[] = recentEventsResult.data ?? [];
    const eventUserIds = Array.from(new Set(recentEvents.map((event) => event.user_id)));

    const eventProfilesResult =
      eventUserIds.length === 0
        ? { data: [], error: null }
        : await supabase.from('profiles').select('*').in('id', eventUserIds);

    if (eventProfilesResult.error !== null) {
      throw createQueryError('Unable to load profile metadata for recent geofencing events.', eventProfilesResult.error);
    }

    const alexaTriggers: AlexaTriggerRow[] = alexaTriggersResult.data ?? [];
    const memberProfiles: ProfileRow[] = memberProfilesResult.data ?? [];
    const eventProfiles: ProfileRow[] = eventProfilesResult.data ?? [];
    const filterOptions = createGeofencingWorkspaceFilterOptions(appliedFilters, groups, groupMembers, memberProfiles);

    return mapGeofencingWorkspaceSnapshot({
      appliedFilters,
      alexaTriggers,
      eventProfiles,
      filterOptions,
      fetchedAt: new Date().toISOString(),
      groups,
      recentEvents,
      role,
      zones: filteredZones,
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      handleError(error, 'geofencingWorkspaceQuery.getGeofencingWorkspaceSnapshot');
      throw error;
    }

    handleError(error, 'geofencingWorkspaceQuery.getGeofencingWorkspaceSnapshot');
    throw createQueryError('Unexpected geofencing workspace query failure.', error);
  }
}

export { RECENT_EVENTS_LIMIT };
