import * as Location from 'expo-location';

import { TRACKING_TASK_NAME, type TrackingPermissionStatus } from './types';

const TRACKING_NOTIFICATION_COLOR = '#38bdf8';

const TRACKING_TASK_OPTIONS: Location.LocationTaskOptions = {
  accuracy: Location.Accuracy.Balanced,
  activityType: Location.ActivityType.Fitness,
  deferredUpdatesDistance: 0,
  deferredUpdatesInterval: 0,
  distanceInterval: 25,
  foregroundService: {
    notificationBody: 'Dreyk Companion is uploading raw coordinates for Phase 8 tracking.',
    notificationColor: TRACKING_NOTIFICATION_COLOR,
    notificationTitle: 'Dreyk tracking active',
  },
  pausesUpdatesAutomatically: false,
  showsBackgroundLocationIndicator: true,
  timeInterval: 15000,
};

export async function getTrackingPermissionStatus(): Promise<TrackingPermissionStatus> {
  const foregroundPermission = await Location.getForegroundPermissionsAsync();
  const backgroundPermission = await Location.getBackgroundPermissionsAsync();

  if (
    foregroundPermission.status === Location.PermissionStatus.GRANTED &&
    backgroundPermission.status === Location.PermissionStatus.GRANTED
  ) {
    return 'granted';
  }

  if (
    foregroundPermission.status === Location.PermissionStatus.DENIED ||
    backgroundPermission.status === Location.PermissionStatus.DENIED
  ) {
    return 'denied';
  }

  return 'unknown';
}

export async function requestTrackingPermissions(): Promise<TrackingPermissionStatus> {
  const foregroundPermission = await Location.requestForegroundPermissionsAsync();

  if (foregroundPermission.status !== Location.PermissionStatus.GRANTED) {
    return 'denied';
  }

  const backgroundPermission = await Location.requestBackgroundPermissionsAsync();

  return backgroundPermission.status === Location.PermissionStatus.GRANTED ? 'granted' : 'denied';
}

export async function startTrackingRuntime(): Promise<void> {
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(TRACKING_TASK_NAME);

  if (hasStarted) {
    return;
  }

  await Location.startLocationUpdatesAsync(TRACKING_TASK_NAME, TRACKING_TASK_OPTIONS);
}

export async function pauseTrackingRuntime(): Promise<void> {
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(TRACKING_TASK_NAME);

  if (hasStarted === false) {
    return;
  }

  await Location.stopLocationUpdatesAsync(TRACKING_TASK_NAME);
}

export async function resumeTrackingRuntime(): Promise<void> {
  await startTrackingRuntime();
}
