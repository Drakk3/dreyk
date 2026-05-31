import { describe, expect, it } from 'vitest';

import { createTrackingIngestRequestBody, createTrackingUploadPayload } from './trackingPayloads';

describe('trackingPayloads', () => {
  it('maps a raw location sample into the upload payload shape', () => {
    const payload = createTrackingUploadPayload({
      coords: {
        accuracy: 12,
        altitude: 150,
        heading: Number.NaN,
        latitude: -34.6037,
        longitude: -58.3816,
        speed: null,
      },
      timestamp: Date.parse('2026-05-31T19:00:00.000Z'),
    });

    expect(payload).toEqual({
      accuracyMeters: 12,
      altitudeMeters: 150,
      capturedAt: '2026-05-31T19:00:00.000Z',
      headingDegrees: null,
      latitude: -34.6037,
      longitude: -58.3816,
      speedMetersPerSecond: null,
    });
    expect(createTrackingIngestRequestBody(payload)).toEqual({
      points: [payload],
    });
  });

  it('rejects coordinates outside the allowed latitude and longitude range', () => {
    expect(() =>
      createTrackingUploadPayload({
        coords: {
          accuracy: null,
          altitude: null,
          heading: null,
          latitude: 91,
          longitude: -58.3816,
          speed: null,
        },
        timestamp: Date.now(),
      }),
    ).toThrow('Tracking payload latitude must be a finite number between -90 and 90.');

    expect(() =>
      createTrackingUploadPayload({
        coords: {
          accuracy: null,
          altitude: null,
          heading: null,
          latitude: -34.6037,
          longitude: 181,
          speed: null,
        },
        timestamp: Date.now(),
      }),
    ).toThrow('Tracking payload longitude must be a finite number between -180 and 180.');
  });
});
