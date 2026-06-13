import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import type { SupabaseDatabase } from '@dreyk/shared/types/database';

import {
  createAlexaOauthErrorPayload,
  createAlexaTokenSuccessPayload,
  parseAlexaTokenRequest,
  verifySignedAlexaToken,
} from '@/lib/alexa/accountLinking';
import { getPublicEnv } from '@/lib/config/env';
import { getPrivateEnv } from '@/lib/config/privateEnv';
import { handleError } from '@/shared/lib/errors';

interface LinkEligibility {
  profileId: string;
  scope: string[];
}

interface LinkedUserEligibilityResult {
  errorMessage: string | null;
  row: LinkedUserEligibilityRow | null;
}

interface ProfileEligibilityResult {
  errorMessage: string | null;
  row: ProfileEligibilityRow | null;
}

interface ResolveLinkEligibilityInput extends LinkEligibility {
  eligibilityClient: AlexaTokenEligibilityClient;
}

export interface AlexaTokenEligibilityClient {
  getLinkedUserEligibility: (profileId: string) => Promise<LinkedUserEligibilityResult>;
  getProfileEligibility: (profileId: string) => Promise<ProfileEligibilityResult>;
}

export interface AlexaAccountLinkingTokenRouteDependencies {
  createEligibilityClient: () => AlexaTokenEligibilityClient;
  env: ReturnType<typeof getPrivateEnv>;
}

interface ProfileEligibilityRow {
  id: string;
  is_active: boolean;
}

interface LinkedUserEligibilityRow {
  linkage_status: 'linked' | 'pending' | 'unlinked';
}

function createNoStoreHeaders(): HeadersInit {
  return {
    'Cache-Control': 'no-store',
    Pragma: 'no-cache',
  };
}

function createAdminClient(): ReturnType<typeof createClient<SupabaseDatabase>> {
  const publicEnv = getPublicEnv();
  const privateEnv = getPrivateEnv();

  return createClient<SupabaseDatabase>(publicEnv.supabaseUrl, privateEnv.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function createEligibilityClient(): AlexaTokenEligibilityClient {
  const adminClient = createAdminClient();

  return {
    async getLinkedUserEligibility(profileId: string): Promise<LinkedUserEligibilityResult> {
      const { data, error } = await adminClient
        .from('alexa_linked_users')
        .select('linkage_status')
        .eq('profile_id', profileId)
        .returns<LinkedUserEligibilityRow[]>()
        .maybeSingle();

      return {
        errorMessage: error?.message ?? null,
        row: data,
      };
    },
    async getProfileEligibility(profileId: string): Promise<ProfileEligibilityResult> {
      const { data, error } = await adminClient
        .from('profiles')
        .select('id, is_active')
        .eq('id', profileId)
        .returns<ProfileEligibilityRow[]>()
        .maybeSingle();

      return {
        errorMessage: error?.message ?? null,
        row: data,
      };
    },
  };
}

async function resolveLinkEligibility(input: ResolveLinkEligibilityInput): Promise<boolean> {
  const { errorMessage: profileErrorMessage, row: profile } = await input.eligibilityClient.getProfileEligibility(input.profileId);

  if (profileErrorMessage !== null) {
    throw new Error(`Unable to verify Alexa profile eligibility: ${profileErrorMessage}`);
  }

  if (profile === null || profile.is_active === false) {
    return false;
  }

  const { errorMessage: linkedUserErrorMessage, row: linkedUser } = await input.eligibilityClient.getLinkedUserEligibility(input.profileId);

  if (linkedUserErrorMessage !== null) {
    throw new Error(`Unable to verify Alexa linkage state: ${linkedUserErrorMessage}`);
  }

  if (linkedUser !== null && linkedUser.linkage_status === 'unlinked') {
    return false;
  }

  return input.scope.length > 0;
}

async function exchangeAuthorizationCode(
  code: string,
  dependencies: AlexaAccountLinkingTokenRouteDependencies,
): Promise<Response> {
  let verifiedCode: Awaited<ReturnType<typeof verifySignedAlexaToken>>;

  try {
    verifiedCode = await verifySignedAlexaToken({
      expectedClientId: dependencies.env.alexaAccountLinkingClientId,
      expectedTokenType: 'code',
      secret: dependencies.env.alexaAccountLinkingTokenSecret,
      token: code,
    });
  } catch (error: unknown) {
    handleError(error, 'createAlexaAccountLinkingTokenHandler.exchangeAuthorizationCode.verifyCode');
    return NextResponse.json(
      createAlexaOauthErrorPayload('invalid_grant', 'The Alexa authorization code is invalid or expired.'),
      {
        headers: createNoStoreHeaders(),
        status: 400,
      },
    );
  }

  const isEligible = await resolveLinkEligibility({
    eligibilityClient: dependencies.createEligibilityClient(),
    profileId: verifiedCode.payload.profileId,
    scope: verifiedCode.payload.scope,
  });

  if (isEligible === false) {
    return NextResponse.json(
      createAlexaOauthErrorPayload('invalid_grant', 'The Alexa authorization code is no longer eligible for linking.'),
      {
        headers: createNoStoreHeaders(),
        status: 400,
      },
    );
  }

  const successPayload = await createAlexaTokenSuccessPayload({
    clientId: dependencies.env.alexaAccountLinkingClientId,
    profileId: verifiedCode.payload.profileId,
    scope: verifiedCode.payload.scope,
    secret: dependencies.env.alexaAccountLinkingTokenSecret,
  });

  return NextResponse.json(successPayload, {
    headers: createNoStoreHeaders(),
    status: 200,
  });
}

async function exchangeRefreshToken(
  refreshToken: string,
  dependencies: AlexaAccountLinkingTokenRouteDependencies,
): Promise<Response> {
  let verifiedRefreshToken: Awaited<ReturnType<typeof verifySignedAlexaToken>>;

  try {
    verifiedRefreshToken = await verifySignedAlexaToken({
      expectedClientId: dependencies.env.alexaAccountLinkingClientId,
      expectedTokenType: 'refresh',
      secret: dependencies.env.alexaAccountLinkingTokenSecret,
      token: refreshToken,
    });
  } catch (error: unknown) {
    handleError(error, 'createAlexaAccountLinkingTokenHandler.exchangeRefreshToken.verifyRefreshToken');
    return NextResponse.json(
      createAlexaOauthErrorPayload('invalid_grant', 'The Alexa refresh token is invalid or expired.'),
      {
        headers: createNoStoreHeaders(),
        status: 400,
      },
    );
  }

  const isEligible = await resolveLinkEligibility({
    eligibilityClient: dependencies.createEligibilityClient(),
    profileId: verifiedRefreshToken.payload.profileId,
    scope: verifiedRefreshToken.payload.scope,
  });

  if (isEligible === false) {
    return NextResponse.json(
      createAlexaOauthErrorPayload('invalid_grant', 'The Alexa refresh token is no longer eligible for linking.'),
      {
        headers: createNoStoreHeaders(),
        status: 400,
      },
    );
  }

  const successPayload = await createAlexaTokenSuccessPayload({
    clientId: dependencies.env.alexaAccountLinkingClientId,
    profileId: verifiedRefreshToken.payload.profileId,
    scope: verifiedRefreshToken.payload.scope,
    secret: dependencies.env.alexaAccountLinkingTokenSecret,
  });

  return NextResponse.json(successPayload, {
    headers: createNoStoreHeaders(),
    status: 200,
  });
}

export function createAlexaAccountLinkingTokenHandler(
  dependencies: AlexaAccountLinkingTokenRouteDependencies,
): (request: NextRequest) => Promise<Response> {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const requestBody = await request.formData();
      const searchParams = new URLSearchParams();

      for (const [key, value] of requestBody.entries()) {
        if (typeof value === 'string') {
          searchParams.append(key, value);
        }
      }

      let tokenRequest: ReturnType<typeof parseAlexaTokenRequest>;

      try {
        tokenRequest = parseAlexaTokenRequest(searchParams, request.headers.get('authorization'));
      } catch (error: unknown) {
        handleError(error, 'createAlexaAccountLinkingTokenHandler.parseTokenRequest');
        return NextResponse.json(
          createAlexaOauthErrorPayload('invalid_request', 'The Alexa token request is invalid.'),
          {
            headers: createNoStoreHeaders(),
            status: 400,
          },
        );
      }

      if (
        tokenRequest.clientId !== dependencies.env.alexaAccountLinkingClientId ||
        tokenRequest.clientSecret !== dependencies.env.alexaAccountLinkingClientSecret
      ) {
        return NextResponse.json(
          createAlexaOauthErrorPayload('invalid_client', 'The Alexa client credentials are invalid.'),
          {
            headers: createNoStoreHeaders(),
            status: 401,
          },
        );
      }

      if (tokenRequest.grantType === 'authorization_code') {
        if (typeof tokenRequest.code !== 'string' || tokenRequest.code.length === 0) {
          return NextResponse.json(
            createAlexaOauthErrorPayload('invalid_request', 'The Alexa authorization code is required.'),
            {
              headers: createNoStoreHeaders(),
              status: 400,
            },
          );
        }

        return exchangeAuthorizationCode(tokenRequest.code, dependencies);
      }

      if (typeof tokenRequest.refreshToken !== 'string' || tokenRequest.refreshToken.length === 0) {
        return NextResponse.json(
          createAlexaOauthErrorPayload('invalid_request', 'The Alexa refresh token is required.'),
          {
            headers: createNoStoreHeaders(),
            status: 400,
          },
        );
      }

      return exchangeRefreshToken(tokenRequest.refreshToken, dependencies);
    } catch (error: unknown) {
      handleError(error, 'alexaAccountLinkingToken.POST');

      return NextResponse.json(
        createAlexaOauthErrorPayload('temporarily_unavailable', 'The Alexa token request could not be completed right now.'),
        {
          headers: createNoStoreHeaders(),
          status: 503,
        },
      );
    }
  };
}

export async function POST(request: NextRequest): Promise<Response> {
  const env = getPrivateEnv();

  return createAlexaAccountLinkingTokenHandler({
    createEligibilityClient,
    env,
  })(request);
}
