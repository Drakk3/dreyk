export type AlexaDeliveryStatus = 'pending' | 'sent' | 'failed' | 'skipped';
export type AlexaLinkageStatus = 'pending' | 'linked' | 'unlinked';
export type AlexaNotificationPermissionStatus = 'unknown' | 'granted' | 'denied';
export type AlexaNotificationSubscriptionStatus = 'unknown' | 'subscribed' | 'unsubscribed';
export type AlexaReadinessStatus = 'pending' | 'ready' | 'permission_missing' | 'unsubscribed' | 'unlinked' | 'failed';
export type AlexaWorkflowKey = 'zone-enter-notification' | 'zone-exit-notification';
export type EventType = 'enter' | 'exit';

export interface LocationEventRow {
  distance_meters: number;
  event_type: EventType;
  id: string;
  latitude: number;
  longitude: number;
  triggered_at: string;
  user_id: string;
  zone_id: string;
}

export interface AlexaTriggerRow {
  alexa_device_id: string;
  id: string;
  is_active: boolean;
  linked_user_id: string | null;
  message_template: string;
  workflow_key: AlexaWorkflowKey;
  zone_id: string;
}

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

export interface AlexaDeliveryAttemptRow {
  alexa_linked_user_id: string;
  alexa_trigger_id: string;
  attempt_count: number;
  created_at: string;
  delivered_at: string | null;
  failure_reason: string | null;
  id: string;
  idempotency_key: string;
  last_attempted_at: string | null;
  location_event_id: string;
  provider_message_id: string | null;
  status: AlexaDeliveryStatus;
  updated_at: string;
  workflow_key: AlexaWorkflowKey;
}

export interface AlexaTriggerRequestBody {
  locationEventId: string;
}

interface ErrorResponseBody {
  error: string;
}

interface SuccessResponseBody {
  attemptId: string | null;
  delivered: boolean;
  reason: string | null;
  status: AlexaDeliveryStatus | 'duplicate' | 'ignored';
}

export interface VoiceDeliveryIntent {
  alexaLinkedUserId: string;
  alexaTriggerId: string;
  alexaUserReference: string;
  eventId: string;
  idempotencyKey: string;
  locale: string;
  messageTemplate: string;
  workflowKey: AlexaWorkflowKey;
}

export interface PersistDeliveryAttemptInput {
  alexa_linked_user_id: string;
  alexa_trigger_id: string;
  attempt_count: number;
  delivered_at?: string | null;
  failure_reason?: string | null;
  idempotency_key: string;
  last_attempted_at: string;
  location_event_id: string;
  provider_message_id?: string | null;
  status: AlexaDeliveryStatus;
  workflow_key: AlexaWorkflowKey;
}

export interface AlexaTriggerAdminClient {
  findDeliveryAttempt: (lookup: {
    alexaLinkedUserId: string;
    locationEventId: string;
    workflowKey: AlexaWorkflowKey;
  }) => Promise<{ errorMessage: string | null; row: AlexaDeliveryAttemptRow | null }>;
  findLinkedUserById: (id: string) => Promise<{ errorMessage: string | null; row: AlexaLinkedUserRow | null }>;
  findLocationEventById: (id: string) => Promise<{ errorMessage: string | null; row: LocationEventRow | null }>;
  findTriggerByZoneId: (zoneId: string) => Promise<{ errorMessage: string | null; row: AlexaTriggerRow | null }>;
  persistDeliveryAttempt: (input: PersistDeliveryAttemptInput) => Promise<{ errorMessage: string | null; row: AlexaDeliveryAttemptRow | null }>;
}

export interface AlexaAccessTokenResult {
  accessToken: string | null;
  errorMessage: string | null;
}

export interface AlexaSendEventInput {
  locale: string;
  message: string;
  referenceId: string;
  userReference: string;
}

export interface AlexaSendEventResult {
  errorMessage: string | null;
  providerMessageId: string | null;
}

export interface AlexaProactiveEventsClient {
  fetchAccessToken: () => Promise<AlexaAccessTokenResult>;
  sendProactiveEvent: (input: AlexaSendEventInput & { accessToken: string }) => Promise<AlexaSendEventResult>;
}

export interface AlexaTriggerDependencies {
  createAdminClient: () => AlexaTriggerAdminClient;
  createProactiveEventsClient: () => AlexaProactiveEventsClient;
  triggerSecret: string;
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

function readNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpError(400, `${fieldName} must be a non-empty string.`);
  }

  return value.trim();
}

function readRequiredSecret(request: Request, expectedSecret: string): void {
  const suppliedSecret = request.headers.get('x-alexa-trigger-secret');

  if (typeof suppliedSecret !== 'string' || suppliedSecret.length === 0) {
    throw new HttpError(401, 'Missing trigger secret header.');
  }

  if (suppliedSecret !== expectedSecret) {
    throw new HttpError(401, 'Invalid trigger secret.');
  }
}

export function parseAlexaTriggerRequestBody(value: unknown): AlexaTriggerRequestBody {
  if (isRecord(value) === false) {
    throw new HttpError(400, 'Request body must be an object.');
  }

  return {
    locationEventId: readNonEmptyString(value.locationEventId, 'locationEventId'),
  };
}

export function mapWorkflowKeyFromEventType(eventType: EventType): AlexaWorkflowKey {
  return eventType === 'enter' ? 'zone-enter-notification' : 'zone-exit-notification';
}

export function buildDeliveryIdempotencyKey(input: {
  alexaLinkedUserId: string;
  locationEventId: string;
  workflowKey: AlexaWorkflowKey;
}): string {
  return `alexa:${input.locationEventId}:${input.alexaLinkedUserId}:${input.workflowKey}`;
}

export function resolveReadinessFailureReason(linkedUser: AlexaLinkedUserRow): string | null {
  if (linkedUser.linkage_status !== 'linked') {
    return 'Linked Alexa user is not actively linked.';
  }

  if (linkedUser.notification_permission_status !== 'granted') {
    return 'Linked Alexa user has not granted notification permission.';
  }

  if (linkedUser.notification_subscription_status !== 'subscribed') {
    return 'Linked Alexa user is not subscribed for notifications.';
  }

  if (linkedUser.readiness_status !== 'ready') {
    return `Linked Alexa user readiness is ${linkedUser.readiness_status}.`;
  }

  return null;
}

export function resolveMessageTemplate(template: string, event: LocationEventRow): string {
  return template
    .replaceAll('{{eventType}}', event.event_type)
    .replaceAll('{{zoneId}}', event.zone_id)
    .replaceAll('{{distanceMeters}}', String(event.distance_meters));
}

async function recordAttempt(
  adminClient: AlexaTriggerAdminClient,
  input: PersistDeliveryAttemptInput,
): Promise<AlexaDeliveryAttemptRow> {
  const { errorMessage, row } = await adminClient.persistDeliveryAttempt(input);

  if (errorMessage !== null || row === null) {
    throw new HttpError(500, `Unable to persist Alexa delivery attempt: ${errorMessage ?? 'Unknown persistence failure.'}`);
  }

  return row;
}

export async function resolveDeliveryIntent(
  adminClient: AlexaTriggerAdminClient,
  locationEventId: string,
): Promise<
  | { intent: VoiceDeliveryIntent; priorAttempt: AlexaDeliveryAttemptRow | null; status: 'ready' }
  | { reason: string; status: 'ignored' | 'skipped'; attempt: AlexaDeliveryAttemptRow | null }
> {
  const { errorMessage: eventErrorMessage, row: locationEvent } = await adminClient.findLocationEventById(locationEventId);

  if (eventErrorMessage !== null) {
    throw new HttpError(500, `Unable to load location event: ${eventErrorMessage}`);
  }

  if (locationEvent === null) {
    throw new HttpError(404, 'Location event not found.');
  }

  const { errorMessage: triggerErrorMessage, row: trigger } = await adminClient.findTriggerByZoneId(locationEvent.zone_id);

  if (triggerErrorMessage !== null) {
    throw new HttpError(500, `Unable to load Alexa trigger: ${triggerErrorMessage}`);
  }

  if (trigger === null || trigger.is_active === false) {
    return {
      attempt: null,
      reason: 'No active Alexa trigger is configured for this zone.',
      status: 'ignored',
    };
  }

  const expectedWorkflowKey = mapWorkflowKeyFromEventType(locationEvent.event_type);

  if (trigger.workflow_key !== expectedWorkflowKey) {
    return {
      attempt: null,
      reason: 'Alexa trigger workflow does not match the location event type.',
      status: 'ignored',
    };
  }

  if (trigger.linked_user_id === null) {
    return {
      attempt: null,
      reason: 'Alexa trigger has no linked Alexa user.',
      status: 'ignored',
    };
  }

  const { errorMessage: linkedUserErrorMessage, row: linkedUser } = await adminClient.findLinkedUserById(trigger.linked_user_id);

  if (linkedUserErrorMessage !== null) {
    throw new HttpError(500, `Unable to load linked Alexa user: ${linkedUserErrorMessage}`);
  }

  if (linkedUser === null) {
    return {
      attempt: null,
      reason: 'Configured linked Alexa user no longer exists.',
      status: 'ignored',
    };
  }

  const priorAttemptLookup = await adminClient.findDeliveryAttempt({
    alexaLinkedUserId: linkedUser.id,
    locationEventId: locationEvent.id,
    workflowKey: trigger.workflow_key,
  });

  if (priorAttemptLookup.errorMessage !== null) {
    throw new HttpError(500, `Unable to load delivery attempt: ${priorAttemptLookup.errorMessage}`);
  }

  if (priorAttemptLookup.row?.status === 'sent' || priorAttemptLookup.row?.status === 'pending') {
    return {
      intent: {
        alexaLinkedUserId: linkedUser.id,
        alexaTriggerId: trigger.id,
        alexaUserReference: linkedUser.alexa_user_reference,
        eventId: locationEvent.id,
        idempotencyKey: buildDeliveryIdempotencyKey({
          alexaLinkedUserId: linkedUser.id,
          locationEventId: locationEvent.id,
          workflowKey: trigger.workflow_key,
        }),
        locale: linkedUser.locale ?? 'en-US',
        messageTemplate: resolveMessageTemplate(trigger.message_template, locationEvent),
        workflowKey: trigger.workflow_key,
      },
      priorAttempt: priorAttemptLookup.row,
      status: 'ready',
    };
  }

  const readinessFailureReason = resolveReadinessFailureReason(linkedUser);

  if (readinessFailureReason !== null) {
    const attempt = await recordAttempt(adminClient, {
      alexa_linked_user_id: linkedUser.id,
      alexa_trigger_id: trigger.id,
      attempt_count: (priorAttemptLookup.row?.attempt_count ?? 0) + 1,
      delivered_at: null,
      failure_reason: readinessFailureReason,
      idempotency_key: buildDeliveryIdempotencyKey({
        alexaLinkedUserId: linkedUser.id,
        locationEventId: locationEvent.id,
        workflowKey: trigger.workflow_key,
      }),
      last_attempted_at: new Date().toISOString(),
      location_event_id: locationEvent.id,
      provider_message_id: null,
      status: 'skipped',
      workflow_key: trigger.workflow_key,
    });

    return {
      attempt,
      reason: readinessFailureReason,
      status: 'skipped',
    };
  }

  return {
    intent: {
      alexaLinkedUserId: linkedUser.id,
      alexaTriggerId: trigger.id,
      alexaUserReference: linkedUser.alexa_user_reference,
      eventId: locationEvent.id,
      idempotencyKey: buildDeliveryIdempotencyKey({
        alexaLinkedUserId: linkedUser.id,
        locationEventId: locationEvent.id,
        workflowKey: trigger.workflow_key,
      }),
      locale: linkedUser.locale ?? 'en-US',
      messageTemplate: resolveMessageTemplate(trigger.message_template, locationEvent),
      workflowKey: trigger.workflow_key,
    },
    priorAttempt: priorAttemptLookup.row,
    status: 'ready',
  };
}

export function createAlexaTriggerHandler(dependencies: AlexaTriggerDependencies): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') {
      return createJsonResponse({ error: 'Method not allowed.' }, 405);
    }

    try {
      readRequiredSecret(request, dependencies.triggerSecret);
      const requestBody: unknown = await request.json();
      const { locationEventId } = parseAlexaTriggerRequestBody(requestBody);
      const adminClient = dependencies.createAdminClient();
      const deliveryResolution = await resolveDeliveryIntent(adminClient, locationEventId);

      if (deliveryResolution.status === 'ignored') {
        return createJsonResponse(
          {
            attemptId: null,
            delivered: false,
            reason: deliveryResolution.reason,
            status: 'ignored',
          },
          200,
        );
      }

      if (deliveryResolution.status === 'skipped') {
        return createJsonResponse(
          {
            attemptId: deliveryResolution.attempt?.id ?? null,
            delivered: false,
            reason: deliveryResolution.reason,
            status: deliveryResolution.attempt?.status ?? 'skipped',
          },
          200,
        );
      }

      if (deliveryResolution.priorAttempt?.status === 'sent') {
        return createJsonResponse(
          {
            attemptId: deliveryResolution.priorAttempt.id,
            delivered: true,
            reason: 'Duplicate delivery suppressed because this intent was already sent.',
            status: 'duplicate',
          },
          200,
        );
      }

      if (deliveryResolution.priorAttempt?.status === 'pending') {
        return createJsonResponse(
          {
            attemptId: deliveryResolution.priorAttempt.id,
            delivered: false,
            reason: 'Delivery is already pending for this intent.',
            status: 'duplicate',
          },
          200,
        );
      }

      const pendingAttempt = await recordAttempt(adminClient, {
        alexa_linked_user_id: deliveryResolution.intent.alexaLinkedUserId,
        alexa_trigger_id: deliveryResolution.intent.alexaTriggerId,
        attempt_count: (deliveryResolution.priorAttempt?.attempt_count ?? 0) + 1,
        delivered_at: null,
        failure_reason: null,
        idempotency_key: deliveryResolution.intent.idempotencyKey,
        last_attempted_at: new Date().toISOString(),
        location_event_id: deliveryResolution.intent.eventId,
        provider_message_id: null,
        status: 'pending',
        workflow_key: deliveryResolution.intent.workflowKey,
      });

      const proactiveEventsClient = dependencies.createProactiveEventsClient();
      const { accessToken, errorMessage: accessTokenErrorMessage } = await proactiveEventsClient.fetchAccessToken();

      if (accessTokenErrorMessage !== null || accessToken === null) {
        const failedAttempt = await recordAttempt(adminClient, {
          alexa_linked_user_id: deliveryResolution.intent.alexaLinkedUserId,
          alexa_trigger_id: deliveryResolution.intent.alexaTriggerId,
          attempt_count: pendingAttempt.attempt_count,
          delivered_at: null,
          failure_reason: accessTokenErrorMessage ?? 'Unable to acquire Alexa access token.',
          idempotency_key: deliveryResolution.intent.idempotencyKey,
          last_attempted_at: new Date().toISOString(),
          location_event_id: deliveryResolution.intent.eventId,
          provider_message_id: null,
          status: 'failed',
          workflow_key: deliveryResolution.intent.workflowKey,
        });

        return createJsonResponse(
          {
            attemptId: failedAttempt.id,
            delivered: false,
            reason: failedAttempt.failure_reason,
            status: failedAttempt.status,
          },
          502,
        );
      }

      const sendResult = await proactiveEventsClient.sendProactiveEvent({
        accessToken,
        locale: deliveryResolution.intent.locale,
        message: deliveryResolution.intent.messageTemplate,
        referenceId: deliveryResolution.intent.idempotencyKey,
        userReference: deliveryResolution.intent.alexaUserReference,
      });

      if (sendResult.errorMessage !== null) {
        const failedAttempt = await recordAttempt(adminClient, {
          alexa_linked_user_id: deliveryResolution.intent.alexaLinkedUserId,
          alexa_trigger_id: deliveryResolution.intent.alexaTriggerId,
          attempt_count: pendingAttempt.attempt_count,
          delivered_at: null,
          failure_reason: sendResult.errorMessage,
          idempotency_key: deliveryResolution.intent.idempotencyKey,
          last_attempted_at: new Date().toISOString(),
          location_event_id: deliveryResolution.intent.eventId,
          provider_message_id: null,
          status: 'failed',
          workflow_key: deliveryResolution.intent.workflowKey,
        });

        return createJsonResponse(
          {
            attemptId: failedAttempt.id,
            delivered: false,
            reason: failedAttempt.failure_reason,
            status: failedAttempt.status,
          },
          502,
        );
      }

      const sentAttempt = await recordAttempt(adminClient, {
        alexa_linked_user_id: deliveryResolution.intent.alexaLinkedUserId,
        alexa_trigger_id: deliveryResolution.intent.alexaTriggerId,
        attempt_count: pendingAttempt.attempt_count,
        delivered_at: new Date().toISOString(),
        failure_reason: null,
        idempotency_key: deliveryResolution.intent.idempotencyKey,
        last_attempted_at: new Date().toISOString(),
        location_event_id: deliveryResolution.intent.eventId,
        provider_message_id: sendResult.providerMessageId,
        status: 'sent',
        workflow_key: deliveryResolution.intent.workflowKey,
      });

      return createJsonResponse(
        {
          attemptId: sentAttempt.id,
          delivered: true,
          reason: null,
          status: sentAttempt.status,
        },
        200,
      );
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        return createJsonResponse({ error: error.message }, error.status);
      }

      const message = error instanceof Error ? error.message : 'Unexpected Alexa trigger failure.';
      return createJsonResponse({ error: message }, 500);
    }
  };
}
