import { describe, expect, it, vi } from 'vitest';

import {
  createAlexaSkillRuntimeHandler,
  type AlexaLinkedUserRow,
  type AlexaSkillRuntimeAdminClient,
} from './handler';

function createAdminClientMock(): AlexaSkillRuntimeAdminClient {
  return {
    findLinkedUser: vi.fn<AlexaSkillRuntimeAdminClient['findLinkedUser']>(),
    upsertLinkedUser: vi.fn<AlexaSkillRuntimeAdminClient['upsertLinkedUser']>(),
  };
}

function createLinkedUserRow(overrides: Partial<AlexaLinkedUserRow> = {}): AlexaLinkedUserRow {
  return {
    alexa_user_reference: 'amzn1.account.user-1',
    created_at: '2026-06-13T12:00:00.000Z',
    id: 'linked-user-1',
    last_skill_event_at: '2026-06-13T12:05:00.000Z',
    linkage_status: 'linked',
    locale: 'en-US',
    notification_permission_status: 'granted',
    notification_subscription_status: 'subscribed',
    profile_id: 'profile-1',
    readiness_status: 'ready',
    updated_at: '2026-06-13T12:05:00.000Z',
    ...overrides,
  };
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

async function createAccessToken(secret: string, profileId: string): Promise<string> {
  const payloadSegment = encodeBase64Url(
    JSON.stringify({
      clientId: 'dreyk-alexa-account-linking',
      expiresAt: '2099-01-01T00:00:00.000Z',
      issuedAt: '2026-06-13T12:00:00.000Z',
      profileId,
      scope: ['profile', 'voice_integrations:write'],
      tokenType: 'access',
      version: 1,
    }),
  );
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
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadSegment));
  const signatureSegment = Buffer.from(signature).toString('base64url');

  return `${payloadSegment}.${signatureSegment}`;
}

function createRuntimeHandler(adminClient: AlexaSkillRuntimeAdminClient): (request: Request) => Promise<Response> {
  return createAlexaSkillRuntimeHandler({
    config: {
      accountLinkingTokenSecret: 'token-secret',
      supabaseServiceRoleKey: 'service-role-key',
      supabaseUrl: 'https://dreyk.supabase.co',
    },
    createAdminClient: () => adminClient,
  });
}

async function readResponseBody(response: Response): Promise<unknown> {
  return response.json();
}

describe('alexa-skill-runtime handler', () => {
  it('returns a launch response for LaunchRequest envelopes', async () => {
    const adminClient = createAdminClientMock();
    const handler = createRuntimeHandler(adminClient);
    const response = await handler(
      new Request('http://localhost/functions/v1/alexa-skill-runtime', {
        body: JSON.stringify({
          request: {
            locale: 'en-US',
            requestId: 'request-1',
            timestamp: '2026-06-13T12:00:00.000Z',
            type: 'LaunchRequest',
          },
          version: '1.0',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }),
    );

    expect(response.status).toBe(200);
    expect(await readResponseBody(response)).toEqual({
      response: {
        outputSpeech: {
          text: 'Welcome to Dreyk. Ask if your alerts are ready.',
          type: 'PlainText',
        },
        reprompt: {
          outputSpeech: {
            text: 'Ask if your Dreyk alerts are ready.',
            type: 'PlainText',
          },
        },
        shouldEndSession: false,
      },
      version: '1.0',
    });
    expect(adminClient.findLinkedUser).not.toHaveBeenCalled();
    expect(adminClient.upsertLinkedUser).not.toHaveBeenCalled();
  });

  it('returns a help response for supported help intents', async () => {
    const adminClient = createAdminClientMock();
    const handler = createRuntimeHandler(adminClient);
    const response = await handler(
      new Request('http://localhost/functions/v1/alexa-skill-runtime', {
        body: JSON.stringify({
          request: {
            intent: {
              name: 'AMAZON.HelpIntent',
            },
            locale: 'en-US',
            requestId: 'request-2',
            timestamp: '2026-06-13T12:00:00.000Z',
            type: 'IntentRequest',
          },
          version: '1.0',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }),
    );

    expect(response.status).toBe(200);
    expect(await readResponseBody(response)).toEqual({
      response: {
        outputSpeech: {
          text: 'You can say, are my Dreyk alerts ready, or ask for notification help.',
          type: 'PlainText',
        },
        reprompt: {
          outputSpeech: {
            text: 'You can say, are my Dreyk alerts ready?',
            type: 'PlainText',
          },
        },
        shouldEndSession: false,
      },
      version: '1.0',
    });
  });

  it('binds the first linked runtime request and returns readiness speech', async () => {
    const adminClient = createAdminClientMock();

    vi.mocked(adminClient.findLinkedUser)
      .mockResolvedValueOnce({
        errorMessage: null,
        row: null,
      })
      .mockResolvedValueOnce({
        errorMessage: null,
        row: null,
      });
    vi.mocked(adminClient.upsertLinkedUser).mockResolvedValue({
      errorMessage: null,
      row: createLinkedUserRow(),
    });

    const handler = createRuntimeHandler(adminClient);
    const response = await handler(
      new Request('http://localhost/functions/v1/alexa-skill-runtime', {
        body: JSON.stringify({
          request: {
            intent: {
              name: 'ReadinessStatusIntent',
            },
            locale: 'en-US',
            requestId: 'request-3',
            timestamp: '2026-06-13T12:00:00.000Z',
            type: 'IntentRequest',
          },
          session: {
            user: {
              accessToken: await createAccessToken('token-secret', 'profile-1'),
              userId: 'amzn1.account.user-1',
            },
          },
          version: '1.0',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }),
    );

    expect(response.status).toBe(200);
    expect(await readResponseBody(response)).toEqual({
      response: {
        outputSpeech: {
          text: 'Your Dreyk alerts are ready.',
          type: 'PlainText',
        },
        shouldEndSession: true,
      },
      version: '1.0',
    });
    expect(adminClient.upsertLinkedUser).toHaveBeenCalledWith(
      expect.objectContaining({
        alexa_user_reference: 'amzn1.account.user-1',
        linkage_status: 'linked',
        locale: 'en-US',
        notification_permission_status: 'unknown',
        notification_subscription_status: 'unknown',
        profile_id: 'profile-1',
        readiness_status: 'pending',
      }),
    );
  });

  it('returns a fallback response for unhandled intents inside the declared contract', async () => {
    const adminClient = createAdminClientMock();
    const handler = createRuntimeHandler(adminClient);
    const response = await handler(
      new Request('http://localhost/functions/v1/alexa-skill-runtime', {
        body: JSON.stringify({
          request: {
            intent: {
              name: 'UnknownIntent',
            },
            locale: 'en-US',
            requestId: 'request-4',
            timestamp: '2026-06-13T12:00:00.000Z',
            type: 'IntentRequest',
          },
          version: '1.0',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }),
    );

    expect(response.status).toBe(200);
    expect(await readResponseBody(response)).toEqual({
      response: {
        outputSpeech: {
          text: 'Dreyk voice support is being prepared. You can ask whether your Dreyk alerts are ready.',
          type: 'PlainText',
        },
        reprompt: {
          outputSpeech: {
            text: 'You can ask whether your Dreyk alerts are ready.',
            type: 'PlainText',
          },
        },
        shouldEndSession: false,
      },
      version: '1.0',
    });
  });

  it('returns a safe error response for unsupported request envelopes', async () => {
    const adminClient = createAdminClientMock();
    const handler = createRuntimeHandler(adminClient);
    const response = await handler(
      new Request('http://localhost/functions/v1/alexa-skill-runtime', {
        body: JSON.stringify({
          request: {
            locale: 'en-US',
            requestId: 'request-5',
            timestamp: '2026-06-13T12:00:00.000Z',
            type: 'CanFulfillIntentRequest',
          },
          version: '1.0',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }),
    );

    expect(response.status).toBe(200);
    expect(await readResponseBody(response)).toEqual({
      response: {
        outputSpeech: {
          text: 'Sorry, Dreyk cannot complete that request right now.',
          type: 'PlainText',
        },
        shouldEndSession: true,
      },
      version: '1.0',
    });
    expect(adminClient.findLinkedUser).not.toHaveBeenCalled();
    expect(adminClient.upsertLinkedUser).not.toHaveBeenCalled();
  });
});
