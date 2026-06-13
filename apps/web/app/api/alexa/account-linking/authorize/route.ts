import { NextRequest, NextResponse } from 'next/server';

import {
  createAuthorizeErrorRedirectUrl,
  createAuthorizeSuccessRedirectUrl,
  createSignedAlexaToken,
  parseAlexaAuthorizeRequest,
} from '@/lib/alexa/accountLinking';
import { getAuthUserContext } from '@/lib/auth/authContext';
import { getPrivateEnv } from '@/lib/config/privateEnv';
import { handleError } from '@/shared/lib/errors';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authorizeRequest = parseAlexaAuthorizeRequest(request.nextUrl.searchParams);
    const env = getPrivateEnv();

    if (authorizeRequest.clientId !== env.alexaAccountLinkingClientId) {
      return NextResponse.redirect(
        createAuthorizeErrorRedirectUrl({
          error: 'invalid_client',
          errorDescription: 'The Alexa account-linking client is not recognized.',
          redirectUri: authorizeRequest.redirectUri,
          state: authorizeRequest.state,
        }),
      );
    }

    const authUserContext = await getAuthUserContext();

    if (authUserContext === null) {
      return NextResponse.redirect(
        createAuthorizeErrorRedirectUrl({
          error: 'access_denied',
          errorDescription: 'You must sign in to Dreyk before linking Alexa.',
          redirectUri: authorizeRequest.redirectUri,
          state: authorizeRequest.state,
        }),
      );
    }

    if (authUserContext.profile.is_active === false) {
      return NextResponse.redirect(
        createAuthorizeErrorRedirectUrl({
          error: 'access_denied',
          errorDescription: 'This Dreyk account is not eligible for Alexa linking.',
          redirectUri: authorizeRequest.redirectUri,
          state: authorizeRequest.state,
        }),
      );
    }

    const code = await createSignedAlexaToken({
      clientId: env.alexaAccountLinkingClientId,
      profileId: authUserContext.profile.id,
      scope: authorizeRequest.scope,
      secret: env.alexaAccountLinkingTokenSecret,
      tokenType: 'code',
    });

    return NextResponse.redirect(
      createAuthorizeSuccessRedirectUrl({
        code,
        redirectUri: authorizeRequest.redirectUri,
        state: authorizeRequest.state,
      }),
    );
  } catch (error: unknown) {
    handleError(error, 'alexaAccountLinkingAuthorize.GET');

    return NextResponse.json(
      {
        error: 'invalid_request',
        error_description: 'The Alexa authorization request is invalid.',
      },
      {
        status: 400,
      },
    );
  }
}
