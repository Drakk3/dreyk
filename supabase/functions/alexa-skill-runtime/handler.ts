export type AlexaEnvelopeRequestType =
  | 'LaunchRequest'
  | 'IntentRequest'
  | 'SessionEndedRequest'
  | 'CanFulfillIntentRequest';

export type AlexaLinkageStatus = 'pending' | 'linked' | 'unlinked';
export type AlexaNotificationPermissionStatus = 'unknown' | 'granted' | 'denied';
export type AlexaNotificationSubscriptionStatus = 'unknown' | 'subscribed' | 'unsubscribed';
export type AlexaReadinessStatus = 'pending' | 'ready' | 'permission_missing' | 'unsubscribed' | 'unlinked' | 'failed';

export type AlexaIntentName =
  | 'AMAZON.CancelIntent'
  | 'AMAZON.FallbackIntent'
  | 'AMAZON.HelpIntent'
  | 'AMAZON.StopIntent'
  | 'NotificationHelpIntent'
  | 'ReadinessStatusIntent';

export interface AlexaEnvelopeSessionUser {
  accessToken?: string;
  userId?: string;
}

export interface AlexaEnvelopeSession {
  new?: boolean;
  sessionId?: string;
  user?: AlexaEnvelopeSessionUser;
}

export interface AlexaEnvelopeIntent {
  name: string;
}

export interface AlexaEnvelopeRequest {
  intent?: AlexaEnvelopeIntent;
  locale: string;
  requestId: string;
  timestamp: string;
  type: AlexaEnvelopeRequestType;
}

export interface AlexaRequestEnvelope {
  request: AlexaEnvelopeRequest;
  session?: AlexaEnvelopeSession;
  version: string;
}

export interface AlexaPlainTextOutputSpeech {
  text: string;
  type: 'PlainText';
}

export interface AlexaResponseBody {
  outputSpeech: AlexaPlainTextOutputSpeech;
  reprompt?: {
    outputSpeech: AlexaPlainTextOutputSpeech;
  };
  shouldEndSession: boolean;
}

export interface AlexaResponseEnvelope {
  response: AlexaResponseBody;
  version: '1.0';
}

export interface AlexaSkillRuntimeConfig {
  accountLinkingTokenSecret: string;
  supabaseServiceRoleKey: string;
  supabaseUrl: string;
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

export interface AlexaSkillRuntimeAdminClient {
  findLinkedUser: (lookup: AlexaLinkedUserLookup) => Promise<{ errorMessage: string | null; row: AlexaLinkedUserRow | null }>;
  upsertLinkedUser: (input: AlexaLinkedUserUpsertInput) => Promise<{ errorMessage: string | null; row: AlexaLinkedUserRow | null }>;
}

export interface AlexaSkillRuntimeDependencies {
  config: AlexaSkillRuntimeConfig;
  createAdminClient: () => AlexaSkillRuntimeAdminClient;
}

interface AlexaAccountLinkingTokenPayload {
  clientId: string;
  expiresAt: string;
  issuedAt: string;
  profileId: string;
  scope: string[];
  tokenType: 'access' | 'code' | 'refresh';
  version: 1;
}

export class HttpError extends Error {
  public readonly status: number;

  public constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
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

function decodeBase64Url(value: string): string {
  const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/');
  const paddingLength = (4 - (normalizedValue.length % 4)) % 4;
  return atob(`${normalizedValue}${'='.repeat(paddingLength)}`);
}

async function verifyTokenSignature(input: { payloadSegment: string; secret: string; signatureSegment: string }): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(input.secret),
    {
      hash: 'SHA-256',
      name: 'HMAC',
    },
    false,
    ['verify'],
  );
  const signatureBytes = Uint8Array.from(decodeBase64Url(input.signatureSegment), (character: string): number =>
    character.charCodeAt(0),
  );

  return crypto.subtle.verify('HMAC', key, signatureBytes, new TextEncoder().encode(input.payloadSegment));
}

function readStringArray(value: unknown, fieldName: string): string[] {
  if (Array.isArray(value) === false) {
    throw new HttpError(401, `${fieldName} must be an array.`);
  }

  return value.map((entry: unknown, index: number): string => readNonEmptyString(entry, `${fieldName}[${index}]`));
}

function parseAccessTokenPayload(value: unknown): AlexaAccountLinkingTokenPayload {
  if (isRecord(value) === false) {
    throw new HttpError(401, 'The Alexa access token payload is invalid.');
  }

  const tokenType = readNonEmptyString(value.tokenType, 'tokenType');

  if (tokenType !== 'access' && tokenType !== 'code' && tokenType !== 'refresh') {
    throw new HttpError(401, 'The Alexa access token type is invalid.');
  }

  const expiresAt = readNonEmptyString(value.expiresAt, 'expiresAt');
  const issuedAt = readNonEmptyString(value.issuedAt, 'issuedAt');

  if (Number.isNaN(new Date(expiresAt).getTime()) || Number.isNaN(new Date(issuedAt).getTime())) {
    throw new HttpError(401, 'The Alexa access token timestamps are invalid.');
  }

  if (value.version !== 1) {
    throw new HttpError(401, 'The Alexa access token version is invalid.');
  }

  return {
    clientId: readNonEmptyString(value.clientId, 'clientId'),
    expiresAt,
    issuedAt,
    profileId: readNonEmptyString(value.profileId, 'profileId'),
    scope: readStringArray(value.scope, 'scope'),
    tokenType,
    version: 1,
  };
}

function isAlexaEnvelopeRequestType(value: unknown): value is AlexaEnvelopeRequestType {
  return (
    value === 'LaunchRequest' ||
    value === 'IntentRequest' ||
    value === 'SessionEndedRequest' ||
    value === 'CanFulfillIntentRequest'
  );
}

export function isSupportedAlexaIntentName(value: string): value is AlexaIntentName {
  return (
    value === 'AMAZON.CancelIntent' ||
    value === 'AMAZON.FallbackIntent' ||
    value === 'AMAZON.HelpIntent' ||
    value === 'AMAZON.StopIntent' ||
    value === 'NotificationHelpIntent' ||
    value === 'ReadinessStatusIntent'
  );
}

function readSession(value: unknown): AlexaEnvelopeSession | undefined {
  if (typeof value === 'undefined') {
    return undefined;
  }

  if (isRecord(value) === false) {
    throw new HttpError(400, 'session must be an object when provided.');
  }

  const user = isRecord(value.user)
    ? {
        accessToken:
          typeof value.user.accessToken === 'string' && value.user.accessToken.length > 0 ? value.user.accessToken : undefined,
        userId: typeof value.user.userId === 'string' && value.user.userId.length > 0 ? value.user.userId : undefined,
      }
    : undefined;

  return {
    new: typeof value.new === 'boolean' ? value.new : undefined,
    sessionId: typeof value.sessionId === 'string' && value.sessionId.length > 0 ? value.sessionId : undefined,
    user,
  };
}

function readIntent(value: unknown, requestType: AlexaEnvelopeRequestType): AlexaEnvelopeIntent | undefined {
  if (requestType !== 'IntentRequest') {
    return undefined;
  }

  if (isRecord(value) === false) {
    throw new HttpError(400, 'request.intent must be an object for IntentRequest envelopes.');
  }

  return {
    name: readNonEmptyString(value.name, 'request.intent.name'),
  };
}

export function parseAlexaRequestEnvelope(value: unknown): AlexaRequestEnvelope {
  if (isRecord(value) === false || isRecord(value.request) === false) {
    throw new HttpError(400, 'Request body must include a request object.');
  }

  const requestType = value.request.type;

  if (isAlexaEnvelopeRequestType(requestType) === false) {
    throw new HttpError(400, 'request.type is not supported by the Alexa skill runtime.');
  }

  const timestamp = readNonEmptyString(value.request.timestamp, 'request.timestamp');

  if (Number.isNaN(new Date(timestamp).getTime())) {
    throw new HttpError(400, 'request.timestamp must be a valid ISO datetime.');
  }

  return {
    request: {
      intent: readIntent(value.request.intent, requestType),
      locale: readNonEmptyString(value.request.locale, 'request.locale'),
      requestId: readNonEmptyString(value.request.requestId, 'request.requestId'),
      timestamp,
      type: requestType,
    },
    session: readSession(value.session),
    version: readNonEmptyString(value.version, 'version'),
  };
}

export function createAlexaResponseEnvelope(input: {
  repromptText?: string;
  shouldEndSession: boolean;
  speechText: string;
}): AlexaResponseEnvelope {
  const outputSpeech: AlexaPlainTextOutputSpeech = {
    text: input.speechText,
    type: 'PlainText',
  };

  return {
    response: {
      outputSpeech,
      reprompt:
        typeof input.repromptText === 'string'
          ? {
              outputSpeech: {
                text: input.repromptText,
                type: 'PlainText',
              },
            }
          : undefined,
      shouldEndSession: input.shouldEndSession,
    },
    version: '1.0',
  };
}

export function createAlexaFallbackResponse(): AlexaResponseEnvelope {
  return createAlexaResponseEnvelope({
    repromptText: 'You can ask whether your Dreyk alerts are ready.',
    shouldEndSession: false,
    speechText: 'Dreyk voice support is being prepared. You can ask whether your Dreyk alerts are ready.',
  });
}

export function createAlexaLaunchResponse(): AlexaResponseEnvelope {
  return createAlexaResponseEnvelope({
    repromptText: 'Ask if your Dreyk alerts are ready.',
    shouldEndSession: false,
    speechText: 'Welcome to Dreyk. Ask if your alerts are ready.',
  });
}

export function createAlexaHelpResponse(): AlexaResponseEnvelope {
  return createAlexaResponseEnvelope({
    repromptText: 'You can say, are my Dreyk alerts ready?',
    shouldEndSession: false,
    speechText: 'You can say, are my Dreyk alerts ready, or ask for notification help.',
  });
}

export function createAlexaCancelResponse(): AlexaResponseEnvelope {
  return createAlexaResponseEnvelope({
    shouldEndSession: true,
    speechText: 'Okay, goodbye.',
  });
}

export function createAlexaAccountLinkRequiredResponse(): AlexaResponseEnvelope {
  return createAlexaResponseEnvelope({
    shouldEndSession: true,
    speechText: 'Please link your Dreyk account in the Alexa app, then ask again.',
  });
}

function deriveAlexaReadinessStatus(input: {
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

async function verifyAlexaAccessToken(input: {
  expectedSecret: string;
  token: string;
}): Promise<AlexaAccountLinkingTokenPayload> {
  const segments = input.token.split('.');

  if (segments.length !== 2) {
    throw new HttpError(401, 'The Alexa access token format is invalid.');
  }

  const [payloadSegment, signatureSegment] = segments;

  if (!payloadSegment || !signatureSegment) {
    throw new HttpError(401, 'The Alexa access token format is invalid.');
  }

  const signatureIsValid = await verifyTokenSignature({
    payloadSegment,
    secret: input.expectedSecret,
    signatureSegment,
  });

  if (signatureIsValid === false) {
    throw new HttpError(401, 'The Alexa access token signature is invalid.');
  }

  const parsedPayload: unknown = JSON.parse(decodeBase64Url(payloadSegment));
  const payload = parseAccessTokenPayload(parsedPayload);

  if (payload.tokenType !== 'access') {
    throw new HttpError(401, 'The Alexa access token type is invalid.');
  }

  if (new Date(payload.expiresAt).getTime() <= Date.now()) {
    throw new HttpError(401, 'The Alexa access token has expired.');
  }

  return payload;
}

async function resolveLinkedUser(
  adminClient: AlexaSkillRuntimeAdminClient,
  lookup: AlexaLinkedUserLookup,
): Promise<AlexaLinkedUserRow | null> {
  const { errorMessage, row } = await adminClient.findLinkedUser(lookup);

  if (errorMessage !== null) {
    throw new HttpError(500, `Unable to resolve Alexa linkage state: ${errorMessage}`);
  }

  return row;
}

async function bindLinkedUser(input: {
  adminClient: AlexaSkillRuntimeAdminClient;
  alexaUserReference: string;
  locale: string;
  profileId: string;
}): Promise<AlexaLinkedUserRow> {
  const profileLinkedUser = await resolveLinkedUser(input.adminClient, {
    profileId: input.profileId,
  });
  const alexaReferenceLinkedUser = await resolveLinkedUser(input.adminClient, {
    alexaUserReference: input.alexaUserReference,
  });

  if (
    alexaReferenceLinkedUser !== null &&
    alexaReferenceLinkedUser.profile_id !== input.profileId
  ) {
    throw new HttpError(403, 'This Alexa account is already linked to a different Dreyk profile.');
  }

  const currentRow = profileLinkedUser ?? alexaReferenceLinkedUser;
  const readinessStatus = deriveAlexaReadinessStatus({
    linkageStatus: 'linked',
    permissionStatus: currentRow?.notification_permission_status ?? 'unknown',
    subscriptionStatus: currentRow?.notification_subscription_status ?? 'unknown',
  });
  const { errorMessage, row } = await input.adminClient.upsertLinkedUser({
    alexa_user_reference: input.alexaUserReference,
    last_skill_event_at: new Date().toISOString(),
    linkage_status: 'linked',
    locale: input.locale,
    notification_permission_status: currentRow?.notification_permission_status ?? 'unknown',
    notification_subscription_status: currentRow?.notification_subscription_status ?? 'unknown',
    profile_id: input.profileId,
    readiness_status: readinessStatus,
  });

  if (errorMessage !== null || row === null) {
    throw new HttpError(500, `Unable to persist Alexa linkage state: ${errorMessage ?? 'Unknown persistence failure.'}`);
  }

  return row;
}

function createReadinessResponse(readinessStatus: AlexaReadinessStatus): AlexaResponseEnvelope {
  if (readinessStatus === 'ready') {
    return createAlexaResponseEnvelope({
      shouldEndSession: true,
      speechText: 'Your Dreyk alerts are ready.',
    });
  }

  if (readinessStatus === 'permission_missing') {
    return createAlexaResponseEnvelope({
      shouldEndSession: true,
      speechText: 'Your Dreyk account is linked, but Alexa notification permission is missing.',
    });
  }

  if (readinessStatus === 'unsubscribed') {
    return createAlexaResponseEnvelope({
      shouldEndSession: true,
      speechText: 'Your Dreyk account is linked, but proactive notifications are unsubscribed.',
    });
  }

  if (readinessStatus === 'unlinked') {
    return createAlexaAccountLinkRequiredResponse();
  }

  if (readinessStatus === 'failed') {
    return createAlexaErrorResponse();
  }

  return createAlexaResponseEnvelope({
    shouldEndSession: true,
    speechText: 'Your Dreyk alerts are almost ready. Finish Alexa notification permissions and subscription setup, then ask again.',
  });
}

async function routeAlexaEnvelope(
  envelope: AlexaRequestEnvelope,
  dependencies: AlexaSkillRuntimeDependencies,
): Promise<AlexaResponseEnvelope> {
  if (envelope.request.type === 'LaunchRequest') {
    return createAlexaLaunchResponse();
  }

  if (envelope.request.type === 'SessionEndedRequest') {
    return createAlexaCancelResponse();
  }

  if (envelope.request.type !== 'IntentRequest') {
    return createAlexaErrorResponse();
  }

  const intentName = envelope.request.intent?.name;

  if (typeof intentName !== 'string') {
    return createAlexaErrorResponse();
  }

  if (isSupportedAlexaIntentName(intentName) === false) {
    return createAlexaFallbackResponse();
  }

  if (intentName === 'AMAZON.HelpIntent' || intentName === 'NotificationHelpIntent') {
    return createAlexaHelpResponse();
  }

  if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
    return createAlexaCancelResponse();
  }

  if (intentName === 'ReadinessStatusIntent') {
    const accessToken = envelope.session?.user?.accessToken;
    const alexaUserReference = envelope.session?.user?.userId;

    if (typeof accessToken !== 'string' || accessToken.length === 0) {
      return createAlexaAccountLinkRequiredResponse();
    }

    if (typeof alexaUserReference !== 'string' || alexaUserReference.length === 0) {
      return createAlexaErrorResponse();
    }

    const verifiedAccessToken = await verifyAlexaAccessToken({
      expectedSecret: dependencies.config.accountLinkingTokenSecret,
      token: accessToken,
    });
    const linkedUser = await bindLinkedUser({
      adminClient: dependencies.createAdminClient(),
      alexaUserReference,
      locale: envelope.request.locale,
      profileId: verifiedAccessToken.profileId,
    });

    return createReadinessResponse(linkedUser.readiness_status);
  }

  if (intentName === 'AMAZON.FallbackIntent') {
    return createAlexaFallbackResponse();
  }

  return createAlexaFallbackResponse();
}

export function createAlexaErrorResponse(): AlexaResponseEnvelope {
  return createAlexaResponseEnvelope({
    shouldEndSession: true,
    speechText: 'Sorry, Dreyk cannot complete that request right now.',
  });
}

export function createJsonResponse(body: AlexaResponseEnvelope, status: number): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
    },
    status,
  });
}

export function createAlexaSkillRuntimeHandler(
  dependencies: AlexaSkillRuntimeDependencies,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') {
      return new Response('Method not allowed.', {
        status: 405,
      });
    }

    try {
      if (
        dependencies.config.accountLinkingTokenSecret.length === 0 ||
        dependencies.config.supabaseServiceRoleKey.length === 0 ||
        dependencies.config.supabaseUrl.length === 0
      ) {
        throw new HttpError(500, 'Alexa runtime configuration is incomplete.');
      }

      const requestBody: unknown = await request.json();
      const envelope = parseAlexaRequestEnvelope(requestBody);
      const responseEnvelope = await routeAlexaEnvelope(envelope, dependencies);

      return createJsonResponse(responseEnvelope, 200);
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        return createJsonResponse(createAlexaErrorResponse(), error.status >= 500 ? 500 : 200);
      }

      return createJsonResponse(createAlexaErrorResponse(), 500);
    }
  };
}
