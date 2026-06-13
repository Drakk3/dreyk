import 'server-only';

const AUTHORIZATION_CODE_TTL_SECONDS = 60 * 5;
const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

export type AlexaOauthErrorCode =
  | 'access_denied'
  | 'invalid_client'
  | 'invalid_grant'
  | 'invalid_request'
  | 'temporarily_unavailable'
  | 'unauthorized_client'
  | 'unsupported_grant_type'
  | 'unsupported_response_type';

export type AlexaOauthGrantType = 'authorization_code' | 'refresh_token';
export type AlexaAccountLinkingTokenType = 'access' | 'code' | 'refresh';

export interface AlexaAuthorizeRequest {
  clientId: string;
  redirectUri: string;
  responseType: 'code';
  scope: string[];
  state: string;
}

export interface AlexaTokenClientCredentials {
  clientId: string | null;
  clientSecret: string | null;
}

export interface AlexaTokenRequest {
  clientId: string | null;
  clientSecret: string | null;
  code: string | null;
  grantType: AlexaOauthGrantType;
  refreshToken: string | null;
}

export interface AlexaOauthErrorPayload {
  error: AlexaOauthErrorCode;
  error_description: string;
}

export interface AlexaAccountLinkingTokenPayload {
  clientId: string;
  expiresAt: string;
  issuedAt: string;
  profileId: string;
  scope: string[];
  tokenType: AlexaAccountLinkingTokenType;
  version: 1;
}

export interface AlexaOauthTokenSuccessPayload {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: 'bearer';
}

export interface CreateSignedAlexaTokenInput {
  clientId: string;
  profileId: string;
  scope: string[];
  secret: string;
  tokenType: AlexaAccountLinkingTokenType;
}

export interface VerifiedAlexaToken {
  payload: AlexaAccountLinkingTokenPayload;
  rawToken: string;
}

interface VerifyTokenSignatureInput {
  payloadSegment: string;
  secret: string;
  signatureSegment: string;
}

interface CreateAuthorizeSuccessRedirectUrlInput {
  code: string;
  redirectUri: string;
  state: string;
}

interface CreateAuthorizeErrorRedirectUrlInput {
  error: AlexaOauthErrorCode;
  errorDescription: string;
  redirectUri: string;
  state: string | null;
}

interface VerifySignedAlexaTokenInput {
  expectedClientId: string;
  expectedTokenType: AlexaAccountLinkingTokenType;
  secret: string;
  token: string;
}

interface CreateAlexaTokenSuccessPayloadInput {
  clientId: string;
  profileId: string;
  scope: string[];
  secret: string;
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} must be provided.`);
  }

  return value.trim();
}

function readStringArray(value: unknown, fieldName: string): string[] {
  if (Array.isArray(value) === false) {
    throw new Error(`${fieldName} must be an array.`);
  }

  return value.map((entry: unknown, index: number): string => readNonEmptyString(entry, `${fieldName}[${index}]`));
}

function getTokenLifetimeSeconds(tokenType: AlexaAccountLinkingTokenType): number {
  if (tokenType === 'code') {
    return AUTHORIZATION_CODE_TTL_SECONDS;
  }

  if (tokenType === 'access') {
    return ACCESS_TOKEN_TTL_SECONDS;
  }

  return REFRESH_TOKEN_TTL_SECONDS;
}

async function signTokenSegment(segment: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    {
      hash: 'SHA-256',
      name: 'HMAC',
    },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(segment));

  return Buffer.from(signature).toString('base64url');
}

async function verifyTokenSignature(input: VerifyTokenSignatureInput): Promise<boolean> {
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

  return crypto.subtle.verify(
    'HMAC',
    key,
    Buffer.from(input.signatureSegment, 'base64url'),
    new TextEncoder().encode(input.payloadSegment),
  );
}

function parseSignedTokenPayload(value: unknown): AlexaAccountLinkingTokenPayload {
  if (isRecord(value) === false) {
    throw new Error('The Alexa token payload is invalid.');
  }

  const expiresAt = readNonEmptyString(value.expiresAt, 'expiresAt');
  const issuedAt = readNonEmptyString(value.issuedAt, 'issuedAt');
  const tokenType = readNonEmptyString(value.tokenType, 'tokenType');

  if (tokenType !== 'access' && tokenType !== 'code' && tokenType !== 'refresh') {
    throw new Error('The Alexa token type is invalid.');
  }

  if (Number.isNaN(new Date(expiresAt).getTime()) || Number.isNaN(new Date(issuedAt).getTime())) {
    throw new Error('The Alexa token timestamps are invalid.');
  }

  const version = value.version;

  if (version !== 1) {
    throw new Error('The Alexa token version is invalid.');
  }

  return {
    clientId: readNonEmptyString(value.clientId, 'clientId'),
    expiresAt,
    issuedAt,
    profileId: readNonEmptyString(value.profileId, 'profileId'),
    scope: readStringArray(value.scope, 'scope'),
    tokenType,
    version,
  };
}

function readRequiredSearchParam(searchParams: URLSearchParams, name: string): string {
  const value = searchParams.get(name);

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} must be provided.`);
  }

  return value.trim();
}

function readGrantType(value: string): AlexaOauthGrantType {
  if (value === 'authorization_code' || value === 'refresh_token') {
    return value;
  }

  throw new Error('grant_type is not supported.');
}

export function parseAlexaAuthorizeRequest(searchParams: URLSearchParams): AlexaAuthorizeRequest {
  const responseType = readRequiredSearchParam(searchParams, 'response_type');

  if (responseType !== 'code') {
    throw new Error('response_type must be code.');
  }

  return {
    clientId: readRequiredSearchParam(searchParams, 'client_id'),
    redirectUri: readRequiredSearchParam(searchParams, 'redirect_uri'),
    responseType: 'code',
    scope: readRequiredSearchParam(searchParams, 'scope')
      .split(/\s+/)
      .filter((scope) => scope.length > 0),
    state: readRequiredSearchParam(searchParams, 'state'),
  };
}

export function parseBasicAuthorizationHeader(value: string | null): AlexaTokenClientCredentials {
  if (typeof value !== 'string' || value.length === 0) {
    return {
      clientId: null,
      clientSecret: null,
    };
  }

  const [scheme, encodedValue] = value.split(' ');

  if (scheme !== 'Basic' || typeof encodedValue !== 'string' || encodedValue.length === 0) {
    return {
      clientId: null,
      clientSecret: null,
    };
  }

  const decodedValue = Buffer.from(encodedValue, 'base64').toString('utf8');
  const separatorIndex = decodedValue.indexOf(':');

  if (separatorIndex === -1) {
    return {
      clientId: null,
      clientSecret: null,
    };
  }

  return {
    clientId: decodedValue.slice(0, separatorIndex),
    clientSecret: decodedValue.slice(separatorIndex + 1),
  };
}

export function parseAlexaTokenRequest(searchParams: URLSearchParams, authorizationHeader: string | null): AlexaTokenRequest {
  const basicCredentials = parseBasicAuthorizationHeader(authorizationHeader);
  const grantType = readGrantType(readRequiredSearchParam(searchParams, 'grant_type'));

  return {
    clientId: basicCredentials.clientId ?? searchParams.get('client_id'),
    clientSecret: basicCredentials.clientSecret ?? searchParams.get('client_secret'),
    code: searchParams.get('code'),
    grantType,
    refreshToken: searchParams.get('refresh_token'),
  };
}

export function createAlexaOauthErrorPayload(
  error: AlexaOauthErrorCode,
  errorDescription: string,
): AlexaOauthErrorPayload {
  return {
    error,
    error_description: errorDescription,
  };
}

export function createAuthorizeSuccessRedirectUrl(input: CreateAuthorizeSuccessRedirectUrlInput): string {
  const redirectUrl = new URL(input.redirectUri);
  redirectUrl.searchParams.set('code', input.code);
  redirectUrl.searchParams.set('state', input.state);

  return redirectUrl.toString();
}

export function createAuthorizeErrorRedirectUrl(input: CreateAuthorizeErrorRedirectUrlInput): string {
  const redirectUrl = new URL(input.redirectUri);
  redirectUrl.searchParams.set('error', input.error);
  redirectUrl.searchParams.set('error_description', input.errorDescription);

  if (typeof input.state === 'string' && input.state.length > 0) {
    redirectUrl.searchParams.set('state', input.state);
  }

  return redirectUrl.toString();
}

export async function createSignedAlexaToken(input: CreateSignedAlexaTokenInput): Promise<string> {
  const issuedAtDate = new Date();
  const expiresAtDate = new Date(issuedAtDate.getTime() + getTokenLifetimeSeconds(input.tokenType) * 1000);
  const payload: AlexaAccountLinkingTokenPayload = {
    clientId: input.clientId,
    expiresAt: expiresAtDate.toISOString(),
    issuedAt: issuedAtDate.toISOString(),
    profileId: input.profileId,
    scope: input.scope,
    tokenType: input.tokenType,
    version: 1,
  };
  const payloadSegment = encodeBase64Url(JSON.stringify(payload));
  const signatureSegment = await signTokenSegment(payloadSegment, input.secret);

  return `${payloadSegment}.${signatureSegment}`;
}

export async function verifySignedAlexaToken(input: VerifySignedAlexaTokenInput): Promise<VerifiedAlexaToken> {
  const segments = input.token.split('.');

  if (segments.length !== 2) {
    throw new Error('The Alexa token format is invalid.');
  }

  const [payloadSegment, signatureSegment] = segments;

  if (!payloadSegment || !signatureSegment) {
    throw new Error('The Alexa token format is invalid.');
  }

  const isSignatureValid = await verifyTokenSignature({
    payloadSegment,
    secret: input.secret,
    signatureSegment,
  });

  if (isSignatureValid === false) {
    throw new Error('The Alexa token signature is invalid.');
  }

  const parsedPayload: unknown = JSON.parse(decodeBase64Url(payloadSegment));
  const payload = parseSignedTokenPayload(parsedPayload);

  if (payload.clientId !== input.expectedClientId) {
    throw new Error('The Alexa token client does not match.');
  }

  if (payload.tokenType !== input.expectedTokenType) {
    throw new Error('The Alexa token type does not match the grant.');
  }

  if (new Date(payload.expiresAt).getTime() <= Date.now()) {
    throw new Error('The Alexa token has expired.');
  }

  return {
    payload,
    rawToken: input.token,
  };
}

export async function createAlexaTokenSuccessPayload(input: CreateAlexaTokenSuccessPayloadInput): Promise<AlexaOauthTokenSuccessPayload> {
  const accessToken = await createSignedAlexaToken({
    clientId: input.clientId,
    profileId: input.profileId,
    scope: input.scope,
    secret: input.secret,
    tokenType: 'access',
  });
  const refreshToken = await createSignedAlexaToken({
    clientId: input.clientId,
    profileId: input.profileId,
    scope: input.scope,
    secret: input.secret,
    tokenType: 'refresh',
  });

  return {
    access_token: accessToken,
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    refresh_token: refreshToken,
    scope: input.scope.join(' '),
    token_type: 'bearer',
  };
}
