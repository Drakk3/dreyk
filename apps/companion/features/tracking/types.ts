export const TRACKING_TASK_NAME = 'dreyk-background-location-task';

export type TrackingPermissionStatus = 'unknown' | 'granted' | 'denied';

export type TrackingStatus = 'inactive' | 'active' | 'paused' | 'blocked';

export interface TrackingUploadPayload {
  accuracyMeters: number | null;
  altitudeMeters: number | null;
  capturedAt: string;
  headingDegrees: number | null;
  latitude: number;
  longitude: number;
  speedMetersPerSecond: number | null;
}

export interface TrackingIngestRequestBody {
  points: TrackingUploadPayload[];
}

export interface TrackingLocationSample {
  coords: {
    accuracy: number | null;
    altitude: number | null;
    heading: number | null;
    latitude: number;
    longitude: number;
    speed: number | null;
  };
  timestamp: number;
}

export interface TrackingRuntimeSnapshot {
  errorMessage: string | null;
  lastCapturedAt: string | null;
  lastUploadedAt: string | null;
  permissionStatus: TrackingPermissionStatus;
  status: TrackingStatus;
}

export interface UseTrackingControllerResult {
  canPause: boolean;
  canResume: boolean;
  canStart: boolean;
  errorMessage: string | null;
  handlePauseTracking: () => Promise<boolean>;
  handleResumeTracking: () => Promise<boolean>;
  handleStartTracking: () => Promise<boolean>;
  isTransitioning: boolean;
  lastCapturedAt: string | null;
  lastUploadedAt: string | null;
  permissionStatus: TrackingPermissionStatus;
  status: TrackingStatus;
}

export interface UseTrackingControllerOptions {
  hasSession: boolean;
  isAuthenticated: boolean;
}
