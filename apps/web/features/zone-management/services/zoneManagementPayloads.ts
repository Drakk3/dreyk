import type { ZoneFormValues, ZoneInsertPayload, ZoneManagementValidationContext, ZoneMutationInput, ZoneUpdatePayload } from '../types';

import { AppError } from '@/shared/lib/errors';

import { validateZoneFormValues } from './zoneManagementValidation';

export function createEmptyZoneFormValues(defaultGroupId: string | null): ZoneFormValues {
  return {
    groupId: defaultGroupId ?? '',
    isActive: true,
    latitude: '',
    longitude: '',
    name: '',
    radiusMeters: '',
  };
}

export function mapZoneToFormValues(zone: Pick<ZoneMutationInput, 'groupId' | 'isActive' | 'latitude' | 'longitude' | 'name' | 'radiusMeters'>): ZoneFormValues {
  return {
    groupId: zone.groupId,
    isActive: zone.isActive,
    latitude: String(zone.latitude),
    longitude: String(zone.longitude),
    name: zone.name,
    radiusMeters: String(zone.radiusMeters),
  };
}

export function buildZoneMutationInput(
  values: ZoneFormValues,
  context: ZoneManagementValidationContext & Pick<ZoneMutationInput, 'createdBy' | 'id'>,
): ZoneMutationInput {
  const validationResult = validateZoneFormValues(values, context);

  if (!validationResult.isValid) {
    throw new AppError('Cannot build a zone payload from invalid form values.', 'zoneManagementPayloads.buildZoneMutationInput');
  }

  return {
    ...(context.createdBy !== undefined ? { createdBy: context.createdBy } : {}),
    ...(context.id !== undefined ? { id: context.id } : {}),
    groupId: values.groupId,
    isActive: values.isActive,
    latitude: Number(values.latitude),
    longitude: Number(values.longitude),
    name: values.name.trim(),
    radiusMeters: Number(values.radiusMeters),
  };
}

export function mapZoneMutationInputToInsertPayload(input: ZoneMutationInput): ZoneInsertPayload {
  if (input.createdBy === undefined) {
    throw new AppError('Create payloads require createdBy.', 'zoneManagementPayloads.mapZoneMutationInputToInsertPayload');
  }

  return {
    created_by: input.createdBy,
    group_id: input.groupId,
    is_active: input.isActive,
    latitude: input.latitude,
    longitude: input.longitude,
    name: input.name,
    radius_meters: input.radiusMeters,
  };
}

export function mapZoneMutationInputToUpdatePayload(input: ZoneMutationInput): ZoneUpdatePayload {
  return {
    group_id: input.groupId,
    is_active: input.isActive,
    latitude: input.latitude,
    longitude: input.longitude,
    name: input.name,
    radius_meters: input.radiusMeters,
  };
}
