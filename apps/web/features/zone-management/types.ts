import type { Database } from '@dreyk/shared/types/database';

import type { SharedGeofencingZoneView } from '@/shared/geofencing/types';

export interface ZoneManagementGroupOption {
  id: string;
  name: string;
}

export interface ZoneManagementSnapshot {
  fetchedAt: string;
  groupOptions: ZoneManagementGroupOption[];
  selectedZoneId: string | null;
  zones: SharedGeofencingZoneView[];
}

export interface ZoneFormValues {
  groupId: string;
  isActive: boolean;
  latitude: string;
  longitude: string;
  name: string;
  radiusMeters: string;
}

export interface ZoneMutationInput {
  createdBy?: string;
  groupId: string;
  id?: string;
  isActive: boolean;
  latitude: number;
  longitude: number;
  name: string;
  radiusMeters: number;
}

export interface ZoneManagementValidationErrors {
  createdBy?: string;
  groupId?: string;
  latitude?: string;
  longitude?: string;
  name?: string;
  radiusMeters?: string;
}

export interface ZoneManagementValidationResult {
  errors: ZoneManagementValidationErrors;
  isValid: boolean;
}

export interface ZoneManagementValidationContext {
  allowedGroupIds: string[];
  createdBy?: string;
  mode: 'create' | 'edit';
}

export type ZoneInsertPayload = Database['public']['Tables']['zones']['Insert'];
export type ZoneUpdatePayload = Database['public']['Tables']['zones']['Update'];
