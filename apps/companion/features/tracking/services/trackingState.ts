import type {
  TrackingPermissionStatus,
  TrackingRuntimeSnapshot,
  TrackingStatus,
} from '../types';

export function createInitialTrackingSnapshot(): TrackingRuntimeSnapshot {
  return {
    errorMessage: null,
    lastCapturedAt: null,
    lastUploadedAt: null,
    permissionStatus: 'unknown',
    status: 'inactive',
  };
}

export function createTrackingPermissionSnapshot(
  snapshot: TrackingRuntimeSnapshot,
  permissionStatus: TrackingPermissionStatus,
): TrackingRuntimeSnapshot {
  return {
    ...snapshot,
    permissionStatus,
  };
}

export function createTrackingStatusSnapshot(
  snapshot: TrackingRuntimeSnapshot,
  status: TrackingStatus,
  errorMessage: string | null = null,
): TrackingRuntimeSnapshot {
  return {
    ...snapshot,
    errorMessage,
    status,
  };
}

export function createTrackingErrorSnapshot(
  snapshot: TrackingRuntimeSnapshot,
  errorMessage: string | null,
): TrackingRuntimeSnapshot {
  return {
    ...snapshot,
    errorMessage,
  };
}

export function createTrackingCapturedSnapshot(
  snapshot: TrackingRuntimeSnapshot,
  capturedAt: string,
): TrackingRuntimeSnapshot {
  return {
    ...snapshot,
    lastCapturedAt: capturedAt,
  };
}

export function createTrackingUploadedSnapshot(
  snapshot: TrackingRuntimeSnapshot,
  uploadedAt: string,
): TrackingRuntimeSnapshot {
  return {
    ...snapshot,
    errorMessage: null,
    lastUploadedAt: uploadedAt,
  };
}
