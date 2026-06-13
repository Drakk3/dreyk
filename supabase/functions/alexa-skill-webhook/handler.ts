export type AlexaLinkageStatus = 'pending' | 'linked' | 'unlinked';
export type AlexaNotificationPermissionStatus = 'unknown' | 'granted' | 'denied';
export type AlexaNotificationSubscriptionStatus = 'unknown' | 'subscribed' | 'unsubscribed';
export type AlexaReadinessStatus = 'pending' | 'ready' | 'permission_missing' | 'unsubscribed' | 'unlinked' | 'failed';
export type AlexaSkillEventType = 'LINKED' | 'UNLINKED' | 'PERMISSION_CHANGED' | 'SUBSCRIPTION_CHANGED';

export interface AlexaLinkedUserRow {
  alexa_user_reference: string;
  created_at: string;
  id: string;
  last_skill_event_at: string | null;
  linkage_status: AlexaLinkageStatus;
  locale: string | null;
  notification_permission_status: AlexaNotificationPermissionStatus;
  notification_subscription_status: AlexaNotificationSubscriptionStatus;
  profile_id: string;
  readiness_status: AlexaReadinessStatus;
  updated_at: string;
}

export interface AlexaSkillEvent {
  alexaUserReference?: string;
  locale?: string | null;
  occurredAt?: string;
  permissionStatus?: AlexaNotificationPermissionStatus;
  profileId?: string;
  subscriptionStatus?: AlexaNotificationSubscriptionStatus;
  type: AlexaSkillEventType;
}

export interface AlexaSkillWebhookRequestBody {
  event: AlexaSkillEvent;
}

interface ErrorResponseBody {
  error: string;
}

interface SuccessResponseBody {
  linkageStatus: AlexaLinkageStatus;
  linkedUserId: string;
  readinessStatus: AlexaReadinessStatus;
}

export interface AlexaLinkedUserLookup {
  alexaUserReference?: string;
  profileId?: string;
}

export interface AlexaLinkedUserUpsertInput {
  alexa_user_reference: string;
  last_skill_event_at: string;
  linkage_status: AlexaLinkageStatus;
  locale: string | null;
  notification_permission_status: AlexaNotificationPermissionStatus;
  notification_subscription_status: AlexaNotificationSubscriptionStatus;
  profile_id: string;
  readiness_status: AlexaReadinessStatus;
}

export interface AlexaSkillWebhookAdminClient {
  findLinkedUser: (lookup: AlexaLinkedUserLookup) => Promise<{ errorMessage: string | null; row: AlexaLinkedUserRow | null }>;
  upsertLinkedUser: (input: AlexaLinkedUserUpsertInput) => Promise<{ errorMessage: string | null; row: AlexaLinkedUserRow | null }>;
}

export interface AlexaSkillWebhookDependencies {
  createAdminClient: () => AlexaSkillWebhookAdminClient;
  webhookSecret: string;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readRequiredSecret(request: Request, expectedSecret: string): void {
  const suppliedSecret = request.headers.get('x-alexa-webhook-secret');

  if (typeof suppliedSecret !== 'string' || suppliedSecret.length === 0) {
    throw new HttpError(401, 'Missing webhook secret header.');
  }

  if (suppliedSecret !== expectedSecret) {
    throw new HttpError(401, 'Invalid webhook secret.');
  }
}

function readNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpError(400, `${fieldName} must be a non-empty string.`);
  }

  return value.trim();
}

function readOptionalLocale(value: unknown): string | null {
  if (value === null || typeof value === 'undefined') {
    return null;
  }

  return readNonEmptyString(value, 'event.locale');
}

function readOccurredAt(value: unknown): string {
  if (typeof value === 'undefined') {
    return new Date().toISOString();
  }

  const occurredAt = readNonEmptyString(value, 'event.occurredAt');
  const parsedDate = new Date(occurredAt);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new HttpError(400, 'event.occurredAt must be a valid ISO datetime.');
  }

  return parsedDate.toISOString();
}

function isPermissionStatus(value: unknown): value is AlexaNotificationPermissionStatus {
  return value === 'unknown' || value === 'granted' || value === 'denied';
}

function isSubscriptionStatus(value: unknown): value is AlexaNotificationSubscriptionStatus {
  return value === 'unknown' || value === 'subscribed' || value === 'unsubscribed';
}

function isEventType(value: unknown): value is AlexaSkillEventType {
  return value === 'LINKED' || value === 'UNLINKED' || value === 'PERMISSION_CHANGED' || value === 'SUBSCRIPTION_CHANGED';
}

function readPermissionStatus(value: unknown): AlexaNotificationPermissionStatus | undefined {
  if (typeof value === 'undefined') {
    return undefined;
  }

  if (isPermissionStatus(value) === false) {
    throw new HttpError(400, 'event.permissionStatus must be one of unknown, granted, or denied.');
  }

  return value;
}

function readSubscriptionStatus(value: unknown): AlexaNotificationSubscriptionStatus | undefined {
  if (typeof value === 'undefined') {
    return undefined;
  }

  if (isSubscriptionStatus(value) === false) {
    throw new HttpError(400, 'event.subscriptionStatus must be one of unknown, subscribed, or unsubscribed.');
  }

  return value;
}

export function parseAlexaSkillWebhookRequestBody(value: unknown): AlexaSkillWebhookRequestBody {
  if (isRecord(value) === false || isRecord(value.event) === false) {
    throw new HttpError(400, 'Request body must include an event object.');
  }

  const eventType = value.event.type;

  if (isEventType(eventType) === false) {
    throw new HttpError(400, 'event.type must be LINKED, UNLINKED, PERMISSION_CHANGED, or SUBSCRIPTION_CHANGED.');
  }

  return {
    event: {
      alexaUserReference:
        typeof value.event.alexaUserReference === 'undefined'
          ? undefined
          : readNonEmptyString(value.event.alexaUserReference, 'event.alexaUserReference'),
      locale: readOptionalLocale(value.event.locale),
      occurredAt: readOccurredAt(value.event.occurredAt),
      permissionStatus: readPermissionStatus(value.event.permissionStatus),
      profileId: typeof value.event.profileId === 'undefined' ? undefined : readNonEmptyString(value.event.profileId, 'event.profileId'),
      subscriptionStatus: readSubscriptionStatus(value.event.subscriptionStatus),
      type: eventType,
    },
  };
}

export function deriveAlexaReadinessStatus(input: {
  linkageStatus: AlexaLinkageStatus;
  permissionStatus: AlexaNotificationPermissionStatus;
  subscriptionStatus: AlexaNotificationSubscriptionStatus;
}): AlexaReadinessStatus {
  if (input.linkageStatus !== 'linked') {
    return 'unlinked';
  }

  if (input.permissionStatus === 'denied') {
    return 'permission_missing';
  }

  if (input.subscriptionStatus === 'unsubscribed') {
    return 'unsubscribed';
  }

  if (input.permissionStatus === 'granted' && input.subscriptionStatus === 'subscribed') {
    return 'ready';
  }

  return 'pending';
}

async function resolveExistingLinkedUser(
  adminClient: AlexaSkillWebhookAdminClient,
  event: AlexaSkillEvent,
): Promise<AlexaLinkedUserRow | null> {
  const lookup: AlexaLinkedUserLookup = {};

  if (typeof event.profileId === 'string') {
    lookup.profileId = event.profileId;
  }

  if (typeof event.alexaUserReference === 'string') {
    lookup.alexaUserReference = event.alexaUserReference;
  }

  if (typeof lookup.profileId === 'undefined' && typeof lookup.alexaUserReference === 'undefined') {
    return null;
  }

  const { errorMessage, row } = await adminClient.findLinkedUser(lookup);

  if (errorMessage !== null) {
    throw new HttpError(500, `Unable to read linked Alexa user: ${errorMessage}`);
  }

  return row;
}

function resolveNextLinkedUserInput(event: AlexaSkillEvent, currentRow: AlexaLinkedUserRow | null): AlexaLinkedUserUpsertInput {
  const profileId = event.profileId ?? currentRow?.profile_id;
  const alexaUserReference = event.alexaUserReference ?? currentRow?.alexa_user_reference;

  if (typeof profileId !== 'string' || profileId.length === 0) {
    throw new HttpError(400, 'A resolvable event.profileId is required for this Alexa event.');
  }

  if (typeof alexaUserReference !== 'string' || alexaUserReference.length === 0) {
    throw new HttpError(400, 'A resolvable event.alexaUserReference is required for this Alexa event.');
  }

  let linkageStatus: AlexaLinkageStatus = currentRow?.linkage_status ?? 'pending';
  let permissionStatus: AlexaNotificationPermissionStatus =
    currentRow?.notification_permission_status ?? 'unknown';
  let subscriptionStatus: AlexaNotificationSubscriptionStatus =
    currentRow?.notification_subscription_status ?? 'unknown';

  if (event.type === 'LINKED') {
    linkageStatus = 'linked';
  }

  if (event.type === 'UNLINKED') {
    linkageStatus = 'unlinked';
    subscriptionStatus = 'unsubscribed';
  }

  if (typeof event.permissionStatus !== 'undefined') {
    permissionStatus = event.permissionStatus;
  }

  if (typeof event.subscriptionStatus !== 'undefined') {
    subscriptionStatus = event.subscriptionStatus;
  }

  const readinessStatus = deriveAlexaReadinessStatus({
    linkageStatus,
    permissionStatus,
    subscriptionStatus,
  });

  return {
    alexa_user_reference: alexaUserReference,
    last_skill_event_at: event.occurredAt ?? new Date().toISOString(),
    linkage_status: linkageStatus,
    locale: event.locale ?? currentRow?.locale ?? null,
    notification_permission_status: permissionStatus,
    notification_subscription_status: subscriptionStatus,
    profile_id: profileId,
    readiness_status: readinessStatus,
  };
}

export function createAlexaSkillWebhookHandler(
  dependencies: AlexaSkillWebhookDependencies,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') {
      return createJsonResponse({ error: 'Method not allowed.' }, 405);
    }

    try {
      readRequiredSecret(request, dependencies.webhookSecret);
      const requestBody: unknown = await request.json();
      const { event } = parseAlexaSkillWebhookRequestBody(requestBody);
      const adminClient = dependencies.createAdminClient();
      const currentRow = await resolveExistingLinkedUser(adminClient, event);
      const nextRowInput = resolveNextLinkedUserInput(event, currentRow);
      const { errorMessage, row } = await adminClient.upsertLinkedUser(nextRowInput);

      if (errorMessage !== null || row === null) {
        throw new HttpError(500, `Unable to persist Alexa linkage state: ${errorMessage ?? 'Unknown persistence failure.'}`);
      }

      return createJsonResponse(
        {
          linkageStatus: row.linkage_status,
          linkedUserId: row.id,
          readinessStatus: row.readiness_status,
        },
        200,
      );
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        return createJsonResponse({ error: error.message }, error.status);
      }

      const message = error instanceof Error ? error.message : 'Unexpected Alexa webhook failure.';
      return createJsonResponse({ error: message }, 500);
    }
  };
}
