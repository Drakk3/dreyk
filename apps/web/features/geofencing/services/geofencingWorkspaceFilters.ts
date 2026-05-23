import type { GeofencingWorkspaceFilterInput } from '../types';

export interface GeofencingWorkspaceRouteSearchParams {
  event?: string | string[];
  group?: string | string[];
  user?: string | string[];
}

function resolveSingleSearchParam(value: string | string[] | undefined): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function resolveEventType(value: string | null): GeofencingWorkspaceFilterInput['eventType'] {
  return value === 'enter' || value === 'exit' ? value : 'all';
}

export function createDefaultGeofencingWorkspaceFilterInput(): GeofencingWorkspaceFilterInput {
  return {
    eventType: 'all',
    groupId: null,
    userId: null,
  };
}

export function parseGeofencingWorkspaceFilterInput(
  searchParams?: GeofencingWorkspaceRouteSearchParams,
): GeofencingWorkspaceFilterInput {
  const groupId = resolveSingleSearchParam(searchParams?.group);
  const userId = resolveSingleSearchParam(searchParams?.user);

  return {
    eventType: resolveEventType(resolveSingleSearchParam(searchParams?.event)),
    groupId,
    userId,
  };
}
