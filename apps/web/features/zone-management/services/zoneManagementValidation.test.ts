import { describe, expect, it } from 'vitest';

import { buildZoneMutationInput, mapZoneMutationInputToInsertPayload, mapZoneMutationInputToUpdatePayload } from './zoneManagementPayloads';
import { validateZoneFormValues } from './zoneManagementValidation';

const BASE_CONTEXT = {
  allowedGroupIds: ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'],
  createdBy: '11111111-1111-4111-8111-111111111111',
  mode: 'create' as const,
};

const VALID_VALUES = {
  groupId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  isActive: true,
  latitude: '4.61',
  longitude: '-74.08',
  name: 'Home',
  radiusMeters: '120',
};

describe('validateZoneFormValues', () => {
  it('accepts valid persisted zone input', () => {
    expect(validateZoneFormValues(VALID_VALUES, BASE_CONTEXT)).toEqual({
      errors: {},
      isValid: true,
    });
  });

  it('rejects missing fields and out-of-bounds coordinates', () => {
    const result = validateZoneFormValues(
      {
        groupId: 'not-a-uuid',
        isActive: true,
        latitude: '91',
        longitude: '-181',
        name: ' ',
        radiusMeters: '0',
      },
      BASE_CONTEXT,
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual({
      groupId: 'A valid group is required.',
      latitude: 'Latitude must stay between -90 and 90.',
      longitude: 'Longitude must stay between -180 and 180.',
      name: 'Zone name is required.',
      radiusMeters: 'Radius must be greater than 0.',
    });
  });
});

describe('zoneManagementPayloads', () => {
  it('maps validated form values into typed insert and update payloads', () => {
    const mutationInput = buildZoneMutationInput(VALID_VALUES, {
      ...BASE_CONTEXT,
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    });

    expect(mapZoneMutationInputToInsertPayload(mutationInput)).toEqual({
      created_by: '11111111-1111-4111-8111-111111111111',
      group_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      is_active: true,
      latitude: 4.61,
      longitude: -74.08,
      name: 'Home',
      radius_meters: 120,
    });

    expect(mapZoneMutationInputToUpdatePayload(mutationInput)).toEqual({
      group_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      is_active: true,
      latitude: 4.61,
      longitude: -74.08,
      name: 'Home',
      radius_meters: 120,
    });
  });
});
