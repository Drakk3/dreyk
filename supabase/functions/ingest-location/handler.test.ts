import { describe, expect, it, vi } from 'vitest';

import {
  createTrackingIngestHandler,
  type TrackingAdminClient,
  type TrackingPointInsertRow,
} from './handler';

function createAdminClientMock(): TrackingAdminClient {
  return {
    getUserFromToken: vi.fn<TrackingAdminClient['getUserFromToken']>(),
    insertTrackingPoints: vi.fn<TrackingAdminClient['insertTrackingPoints']>(),
  };
}

async function readResponseBody(response: Response): Promise<unknown> {
  return response.json();
}

describe('ingest-location handler', () => {
  it('accepts a valid authenticated payload and inserts raw tracking rows only', async () => {
    const adminClient = createAdminClientMock();
    const insertedRows: TrackingPointInsertRow[][] = [];

    vi.mocked(adminClient.getUserFromToken).mockResolvedValue({
      errorMessage: null,
      userId: '11111111-1111-4111-8111-111111111111',
    });
    vi.mocked(adminClient.insertTrackingPoints).mockImplementation(async (rows) => {
      insertedRows.push(rows);

      return {
        errorMessage: null,
      };
    });

    const handler = createTrackingIngestHandler({
      createAdminClient: () => adminClient,
    });
    const response = await handler(
      new Request('http://localhost/functions/v1/ingest-location', {
        body: JSON.stringify({
          points: [
            {
              accuracyMeters: 9,
              altitudeMeters: 12,
              capturedAt: '2026-05-31T19:00:00.000Z',
              headingDegrees: 180,
              latitude: -34.6037,
              longitude: -58.3816,
              speedMetersPerSecond: 4,
            },
          ],
        }),
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }),
    );

    expect(response.status).toBe(201);
    expect(await readResponseBody(response)).toEqual({ insertedCount: 1 });
    expect(insertedRows).toEqual([
      [
        {
          accuracy_meters: 9,
          altitude_meters: 12,
          captured_at: '2026-05-31T19:00:00.000Z',
          heading_degrees: 180,
          latitude: -34.6037,
          longitude: -58.3816,
          speed_meters_per_second: 4,
          user_id: '11111111-1111-4111-8111-111111111111',
        },
      ],
    ]);
  });

  it('rejects invalid authentication without writing rows', async () => {
    const adminClient = createAdminClientMock();

    vi.mocked(adminClient.getUserFromToken).mockResolvedValue({
      errorMessage: 'invalid token',
      userId: null,
    });

    const handler = createTrackingIngestHandler({
      createAdminClient: () => adminClient,
    });
    const response = await handler(
      new Request('http://localhost/functions/v1/ingest-location', {
        body: JSON.stringify({
          points: [
            {
              accuracyMeters: null,
              altitudeMeters: null,
              capturedAt: '2026-05-31T19:00:00.000Z',
              headingDegrees: null,
              latitude: -34.6037,
              longitude: -58.3816,
              speedMetersPerSecond: null,
            },
          ],
        }),
        headers: {
          Authorization: 'Bearer invalid-token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }),
    );

    expect(response.status).toBe(401);
    expect(await readResponseBody(response)).toEqual({ error: 'Invalid authenticated session.' });
    expect(adminClient.insertTrackingPoints).not.toHaveBeenCalled();
  });

  it('rejects invalid payloads without calling auth or inserts', async () => {
    const adminClient = createAdminClientMock();
    const handler = createTrackingIngestHandler({
      createAdminClient: () => adminClient,
    });
    const response = await handler(
      new Request('http://localhost/functions/v1/ingest-location', {
        body: JSON.stringify({
          points: [
            {
              accuracyMeters: null,
              altitudeMeters: null,
              capturedAt: 'not-an-iso-date',
              headingDegrees: null,
              latitude: -34.6037,
              longitude: -58.3816,
              speedMetersPerSecond: null,
            },
          ],
        }),
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }),
    );

    expect(response.status).toBe(400);
    expect(await readResponseBody(response)).toEqual({ error: 'capturedAt must be a valid ISO datetime.' });
    expect(adminClient.getUserFromToken).not.toHaveBeenCalled();
    expect(adminClient.insertTrackingPoints).not.toHaveBeenCalled();
  });
});
