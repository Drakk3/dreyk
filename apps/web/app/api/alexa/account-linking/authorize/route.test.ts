import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const routeMocks = vi.hoisted(() => ({
  getAuthUserContext: vi.fn<typeof import('@/lib/auth/authContext').getAuthUserContext>(),
  getPrivateEnv: vi.fn<typeof import('@/lib/config/privateEnv').getPrivateEnv>(),
  handleError: vi.fn<typeof import('@/shared/lib/errors').handleError>(),
}));

vi.mock('server-only', () => ({}));

import { verifySignedAlexaToken } from '@/lib/alexa/accountLinking';

import { GET } from './route';

vi.mock('@/lib/auth/authContext', () => ({
  getAuthUserContext: routeMocks.getAuthUserContext,
}));

vi.mock('@/lib/config/privateEnv', () => ({
  getPrivateEnv: routeMocks.getPrivateEnv,
}));

vi.mock('@/shared/lib/errors', () => ({
  handleError: routeMocks.handleError,
}));

describe('alexa account-linking authorize route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getPrivateEnv.mockReturnValue({
      alexaAccountLinkingClientId: 'dreyk-alexa-account-linking',
      alexaAccountLinkingClientSecret: 'client-secret',
      alexaAccountLinkingTokenSecret: 'token-secret',
      supabaseServiceRoleKey: 'service-role-key',
    });
  });

  it('redirects back with a signed authorization code for eligible users', async () => {
    routeMocks.getAuthUserContext.mockResolvedValue({
      profile: {
        avatar_url: null,
        created_at: '2026-06-13T12:00:00.000Z',
        display_name: 'Alexa User',
        id: 'profile-1',
        is_active: true,
        role: 'user',
        theme_preference: 'ares',
      },
      role: 'user',
      userId: 'profile-1',
    });

    const response = await GET(
      new NextRequest(
        'https://app.dreyk.com/api/alexa/account-linking/authorize?client_id=dreyk-alexa-account-linking&redirect_uri=https%3A%2F%2Fpitangui.amazon.com%2Fspa%2Fskill%2Faccount-linking-status.html&response_type=code&scope=profile%20voice_integrations%3Awrite&state=state-1',
      ),
    );

    expect(response.status).toBe(307);
    const redirectUrl = response.headers.get('location');
    expect(redirectUrl).not.toBeNull();

    const parsedRedirectUrl = new URL(redirectUrl ?? '');
    expect(parsedRedirectUrl.searchParams.get('state')).toBe('state-1');
    const code = parsedRedirectUrl.searchParams.get('code');

    expect(typeof code).toBe('string');
    const verifiedToken = await verifySignedAlexaToken({
      expectedClientId: 'dreyk-alexa-account-linking',
      expectedTokenType: 'code',
      secret: 'token-secret',
      token: code ?? '',
    });

    expect(verifiedToken.payload.profileId).toBe('profile-1');
    expect(verifiedToken.payload.scope).toEqual(['profile', 'voice_integrations:write']);
  });

  it('redirects with access_denied when the user is not signed in', async () => {
    routeMocks.getAuthUserContext.mockResolvedValue(null);

    const response = await GET(
      new NextRequest(
        'https://app.dreyk.com/api/alexa/account-linking/authorize?client_id=dreyk-alexa-account-linking&redirect_uri=https%3A%2F%2Fpitangui.amazon.com%2Fspa%2Fskill%2Faccount-linking-status.html&response_type=code&scope=profile&state=state-2',
      ),
    );

    expect(response.status).toBe(307);
    const parsedRedirectUrl = new URL(response.headers.get('location') ?? '');

    expect(parsedRedirectUrl.searchParams.get('error')).toBe('access_denied');
    expect(parsedRedirectUrl.searchParams.get('error_description')).toBe('You must sign in to Dreyk before linking Alexa.');
    expect(parsedRedirectUrl.searchParams.get('state')).toBe('state-2');
  });
});
