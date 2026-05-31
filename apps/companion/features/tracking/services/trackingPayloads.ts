import type {
  TrackingIngestRequestBody,
  TrackingLocationSample,
  TrackingUploadPayload,
} from '../types';

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

function normalizeOptionalMetric(value: number | null): number | null {
  if (value === null) {
    return null;
  }

  return isFiniteNumber(value) ? value : null;
}

function validateLatitude(latitude: number): number {
  if (isFiniteNumber(latitude) === false || latitude < -90 || latitude > 90) {
    throw new Error('Tracking payload latitude must be a finite number between -90 and 90.');
  }

  return latitude;
}

function validateLongitude(longitude: number): number {
  if (isFiniteNumber(longitude) === false || longitude < -180 || longitude > 180) {
    throw new Error('Tracking payload longitude must be a finite number between -180 and 180.');
  }

  return longitude;
}

function validateCapturedAt(timestamp: number): string {
  if (Number.isFinite(timestamp) === false) {
    throw new Error('Tracking payload timestamp must be a finite number.');
  }

  const capturedAt = new Date(timestamp).toISOString();

  if (capturedAt === 'Invalid Date') {
    throw new Error('Tracking payload timestamp must resolve to a valid ISO date.');
  }

  return capturedAt;
}

export function createTrackingUploadPayload(sample: TrackingLocationSample): TrackingUploadPayload {
  return {
    accuracyMeters: normalizeOptionalMetric(sample.coords.accuracy),
    altitudeMeters: normalizeOptionalMetric(sample.coords.altitude),
    capturedAt: validateCapturedAt(sample.timestamp),
    headingDegrees: normalizeOptionalMetric(sample.coords.heading),
    latitude: validateLatitude(sample.coords.latitude),
    longitude: validateLongitude(sample.coords.longitude),
    speedMetersPerSecond: normalizeOptionalMetric(sample.coords.speed),
  };
}

export function createTrackingIngestRequestBody(payload: TrackingUploadPayload): TrackingIngestRequestBody {
  return {
    points: [payload],
  };
}
