import type { ZoneFormValues, ZoneManagementValidationContext, ZoneManagementValidationErrors, ZoneManagementValidationResult } from '../types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function parseNumericValue(value: string): number | null {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export function validateZoneFormValues(
  values: ZoneFormValues,
  context: ZoneManagementValidationContext,
): ZoneManagementValidationResult {
  const errors: ZoneManagementValidationErrors = {};
  const trimmedName = values.name.trim();
  const latitude = parseNumericValue(values.latitude);
  const longitude = parseNumericValue(values.longitude);
  const radiusMeters = parseNumericValue(values.radiusMeters);

  if (context.mode === 'create') {
    if (context.createdBy === undefined || !isUuid(context.createdBy)) {
      errors.createdBy = 'The admin identity is required before creating a zone.';
    }
  }

  if (trimmedName.length === 0) {
    errors.name = 'Zone name is required.';
  }

  if (!isUuid(values.groupId)) {
    errors.groupId = 'A valid group is required.';
  } else if (!context.allowedGroupIds.includes(values.groupId)) {
    errors.groupId = 'Select one of the available groups.';
  }

  if (latitude === null || latitude < -90 || latitude > 90) {
    errors.latitude = 'Latitude must stay between -90 and 90.';
  }

  if (longitude === null || longitude < -180 || longitude > 180) {
    errors.longitude = 'Longitude must stay between -180 and 180.';
  }

  if (radiusMeters === null || radiusMeters <= 0) {
    errors.radiusMeters = 'Radius must be greater than 0.';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}
