import { Buffer } from 'node:buffer';

import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const routeMocks = vi.hoisted(() => ({
  handleError: vi.fn<typeof import('@/shared/lib/errors').handleError>(),
}));

vi.mock('server-only', () => ({}));

import { createSignedAlexaToken } from '@/lib/alexa/accountLinking';
import {
  createAlexaAccountLinkingTokenHandler,
  type AlexaTokenEligibilityClient,
} from './handler';

vi.mock('@/shared/lib/errors', () => ({
  handleError: routeMocks.handleError,
}));

interface CreateFormRequestInput {
  authorizationHeader?: string;
  body: Record<string, string>;
}

function createFormRequest(input: CreateFormRequestInput): NextRequest {
  const formData = new FormData();
  const headers = new Headers();

  for (const [key, value] of Object.entries(input.body)) {
    formData.append(key, value);
  }

  if (typeof input.authorizationHeader === 'string') {
    headers.set('authorization', input.authorizationHeader);
  }

  return new NextRequest('https://app.dreyk.com/api/alexa/account-linking/token', {
    body: formData,
    headers,
    method: 'POST',
  });
}

function createBasicAuthorizationHeader(clientId: string, clientSecret: string): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64')}`;
}

interface MockLinkedUserRow {
  linkage_status: 'linked' | 'pending' | 'unlinked';
}

interface MockProfileRow {
  id: string;
  is_active: boolean;
}

interface CreateEligibilityClientMockInput {
  linkedUserRow: MockLinkedUserRow | null;
  linkedUserErrorMessage?: string;
  profileRow: MockProfileRow | null;
  profileErrorMessage?: string;
}

interface MockLinkedUserEligibilityResult {
  errorMessage: string | null;
  row: MockLinkedUserRow | null;
}

interface MockProfileEligibilityResult {
  errorMessage: string | null;
  row: MockProfileRow | null;
}

function createEligibilityClientMock(input: CreateEligibilityClientMockInput): AlexaTokenEligibilityClient {
  return {
    getLinkedUserEligibility(): Promise<MockLinkedUserEligibilityResult> {
      return Promise.resolve({
        errorMessage: input.linkedUserErrorMessage ?? null,
        row: input.linkedUserRow,
      });
    },
    getProfileEligibility(): Promise<MockProfileEligibilityResult> {
      return Promise.resolve({
        errorMessage: input.profileErrorMessage ?? null,
        row: input.profileRow,
      });
    },
  };
}

describe('alexa account-linking token route', () => {
  let eligibilityClient: AlexaTokenEligibilityClient;

  beforeEach(() => {
    vi.clearAllMocks();
    eligibilityClient = createEligibilityClientMock({
      linkedUserRow: null,
      profileRow: {
        id: 'profile-1',
        is_active: true,
      },
    });
  });

  it('returns access and refresh tokens for a valid authorization code exchange', async () => {
    const authorizationCode = await createSignedAlexaToken({
      clientId: 'dreyk-alexa-account-linking',
      profileId: 'profile-1',
      scope: ['profile', 'voice_integrations:write'],
      secret: 'token-secret',
      tokenType: 'code',
    });

    const response = await createAlexaAccountLinkingTokenHandler({
      createEligibilityClient: () => eligibilityClient,
      env: {
        alexaAccountLinkingClientId: 'dreyk-alexa-account-linking',
        alexaAccountLinkingClientSecret: 'client-secret',
        alexaAccountLinkingTokenSecret: 'token-secret',
        supabaseServiceRoleKey: 'service-role-key',
      },
    })(
      createFormRequest({
        authorizationHeader: createBasicAuthorizationHeader('dreyk-alexa-account-linking', 'client-secret'),
        body: {
          code: authorizationCode,
          grant_type: 'authorization_code',
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual(
      expect.objectContaining({
        expires_in: 3600,
        scope: 'profile voice_integrations:write',
        token_type: 'bearer',
      }),
    );
  });

  it('rejects invalid authorization codes with an OAuth invalid_grant response', async () => {
    const response = await createAlexaAccountLinkingTokenHandler({
      createEligibilityClient: () => eligibilityClient,
      env: {
        alexaAccountLinkingClientId: 'dreyk-alexa-account-linking',
        alexaAccountLinkingClientSecret: 'client-secret',
        alexaAccountLinkingTokenSecret: 'token-secret',
        supabaseServiceRoleKey: 'service-role-key',
      },
    })(
      createFormRequest({
        authorizationHeader: createBasicAuthorizationHeader('dreyk-alexa-account-linking', 'client-secret'),
        body: {
          code: 'invalid-code',
          grant_type: 'authorization_code',
        },
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'invalid_grant',
      error_description: 'The Alexa authorization code is invalid or expired.',
    });
  });

  it('rejects refresh tokens for revoked or otherwise ineligible linked accounts', async () => {
    const refreshToken = await createSignedAlexaToken({
      clientId: 'dreyk-alexa-account-linking',
      profileId: 'profile-1',
      scope: ['profile', 'voice_integrations:write'],
      secret: 'token-secret',
      tokenType: 'refresh',
    });

    eligibilityClient = createEligibilityClientMock({
      linkedUserRow: {
        linkage_status: 'unlinked',
      },
      profileRow: {
        id: 'profile-1',
        is_active: true,
      },
    });

    const response = await createAlexaAccountLinkingTokenHandler({
      createEligibilityClient: () => eligibilityClient,
      env: {
        alexaAccountLinkingClientId: 'dreyk-alexa-account-linking',
        alexaAccountLinkingClientSecret: 'client-secret',
        alexaAccountLinkingTokenSecret: 'token-secret',
        supabaseServiceRoleKey: 'service-role-key',
      },
    })(
      createFormRequest({
        authorizationHeader: createBasicAuthorizationHeader('dreyk-alexa-account-linking', 'client-secret'),
        body: {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        },
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'invalid_grant',
      error_description: 'The Alexa refresh token is no longer eligible for linking.',
    });
  });
});
