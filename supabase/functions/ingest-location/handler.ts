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

interface ErrorResponseBody {
  error: string;
}

interface SuccessResponseBody {
  insertedCount: number;
}

export interface TrackingPointInsertRow {
  accuracy_meters: number | null;
  altitude_meters: number | null;
  captured_at: string;
  heading_degrees: number | null;
  latitude: number;
  longitude: number;
  speed_meters_per_second: number | null;
  user_id: string;
}

export interface TrackingAdminClient {
  getUserFromToken: (token: string) => Promise<{ errorMessage: string | null; userId: string | null }>;
  insertTrackingPoints: (rows: TrackingPointInsertRow[]) => Promise<{ errorMessage: string | null }>;
}

export interface TrackingIngestDependencies {
  createAdminClient: () => TrackingAdminClient;
}

export class HttpError extends Error {
  public readonly status: number;

  public constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export function createJsonResponse(body: ErrorResponseBody | SuccessResponseBody, status: number): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
    },
    status,
  });
}

export function extractBearerToken(request: Request): string {
  const authorization = request.headers.get('Authorization');

  if (typeof authorization !== 'string' || authorization.startsWith('Bearer ') === false) {
    throw new HttpError(401, 'Missing bearer authorization header.');
  }

  const token = authorization.slice('Bearer '.length).trim();

  if (token.length === 0) {
    throw new HttpError(401, 'Bearer token cannot be empty.');
  }

  return token;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readFiniteNumber(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || Number.isFinite(value) === false) {
    throw new HttpError(400, `${fieldName} must be a finite number.`);
  }

  return value;
}

function readOptionalFiniteNumber(value: unknown, fieldName: string): number | null {
  if (value === null || typeof value === 'undefined') {
    return null;
  }

  return readFiniteNumber(value, fieldName);
}

function readCapturedAt(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new HttpError(400, 'capturedAt must be a non-empty string.');
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new HttpError(400, 'capturedAt must be a valid ISO datetime.');
  }

  return parsedDate.toISOString();
}

export function parseTrackingUploadPayload(value: unknown): TrackingUploadPayload {
  if (isRecord(value) === false) {
    throw new HttpError(400, 'Each point must be an object payload.');
  }

  const latitude = readFiniteNumber(value.latitude, 'latitude');
  const longitude = readFiniteNumber(value.longitude, 'longitude');

  if (latitude < -90 || latitude > 90) {
    throw new HttpError(400, 'latitude must be between -90 and 90.');
  }

  if (longitude < -180 || longitude > 180) {
    throw new HttpError(400, 'longitude must be between -180 and 180.');
  }

  return {
    accuracyMeters: readOptionalFiniteNumber(value.accuracyMeters, 'accuracyMeters'),
    altitudeMeters: readOptionalFiniteNumber(value.altitudeMeters, 'altitudeMeters'),
    capturedAt: readCapturedAt(value.capturedAt),
    headingDegrees: readOptionalFiniteNumber(value.headingDegrees, 'headingDegrees'),
    latitude,
    longitude,
    speedMetersPerSecond: readOptionalFiniteNumber(value.speedMetersPerSecond, 'speedMetersPerSecond'),
  };
}

export function parseTrackingIngestRequestBody(value: unknown): TrackingIngestRequestBody {
  if (isRecord(value) === false || Array.isArray(value.points) === false || value.points.length === 0) {
    throw new HttpError(400, 'Request body must include a non-empty points array.');
  }

  return {
    points: value.points.map((point) => parseTrackingUploadPayload(point)),
  };
}

export function createTrackingPointInsertRows(points: TrackingUploadPayload[], userId: string): TrackingPointInsertRow[] {
  return points.map((point) => ({
    accuracy_meters: point.accuracyMeters,
    altitude_meters: point.altitudeMeters,
    captured_at: point.capturedAt,
    heading_degrees: point.headingDegrees,
    latitude: point.latitude,
    longitude: point.longitude,
    speed_meters_per_second: point.speedMetersPerSecond,
    user_id: userId,
  }));
}

export function createTrackingIngestHandler(
  dependencies: TrackingIngestDependencies,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') {
      return createJsonResponse({ error: 'Method not allowed.' }, 405);
    }

    try {
      const token = extractBearerToken(request);
      const requestBody: unknown = await request.json();
      const { points } = parseTrackingIngestRequestBody(requestBody);
      const adminClient = dependencies.createAdminClient();
      const { errorMessage: authErrorMessage, userId } = await adminClient.getUserFromToken(token);

      if (authErrorMessage !== null || userId === null) {
        return createJsonResponse({ error: 'Invalid authenticated session.' }, 401);
      }

      const rows = createTrackingPointInsertRows(points, userId);
      const { errorMessage: insertErrorMessage } = await adminClient.insertTrackingPoints(rows);

      if (insertErrorMessage !== null) {
        throw new HttpError(500, `Unable to persist tracking points: ${insertErrorMessage}`);
      }

      return createJsonResponse({ insertedCount: rows.length }, 201);
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        return createJsonResponse({ error: error.message }, error.status);
      }

      const message = error instanceof Error ? error.message : 'Unexpected edge function failure.';
      return createJsonResponse({ error: message }, 500);
    }
  };
}
