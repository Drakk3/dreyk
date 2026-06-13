import { describe, expect, it, vi } from 'vitest';

import {
  createAlexaSkillWebhookHandler,
  type AlexaLinkedUserRow,
  type AlexaSkillWebhookAdminClient,
} from './handler';

function createAdminClientMock(): AlexaSkillWebhookAdminClient {
  return {
    findLinkedUser: vi.fn<AlexaSkillWebhookAdminClient['findLinkedUser']>(),
    upsertLinkedUser: vi.fn<AlexaSkillWebhookAdminClient['upsertLinkedUser']>(),
  };
}

function createLinkedUserRow(overrides: Partial<AlexaLinkedUserRow> = {}): AlexaLinkedUserRow {
  return {
    alexa_user_reference: 'amzn1.account.user-1',
    created_at: '2026-06-06T13:00:00.000Z',
    id: 'linked-user-1',
    last_skill_event_at: '2026-06-06T13:05:00.000Z',
    linkage_status: 'linked',
    locale: 'en-US',
    notification_permission_status: 'unknown',
    notification_subscription_status: 'unknown',
    profile_id: 'profile-1',
    readiness_status: 'pending',
    updated_at: '2026-06-06T13:05:00.000Z',
    ...overrides,
  };
}

describe('alexa-skill-webhook handler', () => {
  it('persists subscription changes and returns ready linkage state', async () => {
    const adminClient = createAdminClientMock();

    vi.mocked(adminClient.findLinkedUser).mockResolvedValue({
      errorMessage: null,
      row: createLinkedUserRow(),
    });
    vi.mocked(adminClient.upsertLinkedUser).mockResolvedValue({
      errorMessage: null,
      row: createLinkedUserRow({
        notification_permission_status: 'granted',
        notification_subscription_status: 'subscribed',
        readiness_status: 'ready',
      }),
    });

    const handler = createAlexaSkillWebhookHandler({
      createAdminClient: () => adminClient,
      webhookSecret: 'secret',
    });
    const response = await handler(
      new Request('http://localhost/functions/v1/alexa-skill-webhook', {
        body: JSON.stringify({
          event: {
            alexaUserReference: 'amzn1.account.user-1',
            permissionStatus: 'granted',
            profileId: 'profile-1',
            subscriptionStatus: 'subscribed',
            type: 'SUBSCRIPTION_CHANGED',
          },
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-alexa-webhook-secret': 'secret',
        },
        method: 'POST',
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      linkageStatus: 'linked',
      linkedUserId: 'linked-user-1',
      readinessStatus: 'ready',
    });
    expect(adminClient.upsertLinkedUser).toHaveBeenCalledWith(
      expect.objectContaining({
        alexa_user_reference: 'amzn1.account.user-1',
        notification_permission_status: 'granted',
        notification_subscription_status: 'subscribed',
        profile_id: 'profile-1',
        readiness_status: 'ready',
      }),
    );
  });

  it('unlinks a linked user and marks readiness as unlinked', async () => {
    const adminClient = createAdminClientMock();

    vi.mocked(adminClient.findLinkedUser).mockResolvedValue({
      errorMessage: null,
      row: createLinkedUserRow({
        notification_permission_status: 'granted',
        notification_subscription_status: 'subscribed',
        readiness_status: 'ready',
      }),
    });
    vi.mocked(adminClient.upsertLinkedUser).mockResolvedValue({
      errorMessage: null,
      row: createLinkedUserRow({
        linkage_status: 'unlinked',
        notification_permission_status: 'granted',
        notification_subscription_status: 'unsubscribed',
        readiness_status: 'unlinked',
      }),
    });

    const handler = createAlexaSkillWebhookHandler({
      createAdminClient: () => adminClient,
      webhookSecret: 'secret',
    });
    const response = await handler(
      new Request('http://localhost/functions/v1/alexa-skill-webhook', {
        body: JSON.stringify({
          event: {
            profileId: 'profile-1',
            type: 'UNLINKED',
          },
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-alexa-webhook-secret': 'secret',
        },
        method: 'POST',
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      linkageStatus: 'unlinked',
      linkedUserId: 'linked-user-1',
      readinessStatus: 'unlinked',
    });
    expect(adminClient.upsertLinkedUser).toHaveBeenCalledWith(
      expect.objectContaining({
        alexa_user_reference: 'amzn1.account.user-1',
        linkage_status: 'unlinked',
        notification_subscription_status: 'unsubscribed',
        profile_id: 'profile-1',
        readiness_status: 'unlinked',
      }),
    );
  });

  it('persists permission changes without reopening the runtime boundary', async () => {
    const adminClient = createAdminClientMock();

    vi.mocked(adminClient.findLinkedUser).mockResolvedValue({
      errorMessage: null,
      row: createLinkedUserRow({
        notification_permission_status: 'granted',
        notification_subscription_status: 'subscribed',
        readiness_status: 'ready',
      }),
    });
    vi.mocked(adminClient.upsertLinkedUser).mockResolvedValue({
      errorMessage: null,
      row: createLinkedUserRow({
        notification_permission_status: 'denied',
        notification_subscription_status: 'subscribed',
        readiness_status: 'permission_missing',
      }),
    });

    const handler = createAlexaSkillWebhookHandler({
      createAdminClient: () => adminClient,
      webhookSecret: 'secret',
    });
    const response = await handler(
      new Request('http://localhost/functions/v1/alexa-skill-webhook', {
        body: JSON.stringify({
          event: {
            alexaUserReference: 'amzn1.account.user-1',
            permissionStatus: 'denied',
            profileId: 'profile-1',
            type: 'PERMISSION_CHANGED',
          },
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-alexa-webhook-secret': 'secret',
        },
        method: 'POST',
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      linkageStatus: 'linked',
      linkedUserId: 'linked-user-1',
      readinessStatus: 'permission_missing',
    });
    expect(adminClient.upsertLinkedUser).toHaveBeenCalledWith(
      expect.objectContaining({
        alexa_user_reference: 'amzn1.account.user-1',
        linkage_status: 'linked',
        notification_permission_status: 'denied',
        notification_subscription_status: 'subscribed',
        profile_id: 'profile-1',
        readiness_status: 'permission_missing',
      }),
    );
  });

  it('rejects invalid requests before touching persistence', async () => {
    const adminClient = createAdminClientMock();
    const handler = createAlexaSkillWebhookHandler({
      createAdminClient: () => adminClient,
      webhookSecret: 'secret',
    });
    const response = await handler(
      new Request('http://localhost/functions/v1/alexa-skill-webhook', {
        body: JSON.stringify({
          event: {
            alexaUserReference: 'amzn1.account.user-1',
            type: 'NOT_REAL',
          },
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-alexa-webhook-secret': 'secret',
        },
        method: 'POST',
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'event.type must be LINKED, UNLINKED, PERMISSION_CHANGED, or SUBSCRIPTION_CHANGED.',
    });
    expect(adminClient.findLinkedUser).not.toHaveBeenCalled();
    expect(adminClient.upsertLinkedUser).not.toHaveBeenCalled();
  });

  it('rejects requests with the wrong webhook secret before touching persistence', async () => {
    const adminClient = createAdminClientMock();
    const handler = createAlexaSkillWebhookHandler({
      createAdminClient: () => adminClient,
      webhookSecret: 'secret',
    });
    const response = await handler(
      new Request('http://localhost/functions/v1/alexa-skill-webhook', {
        body: JSON.stringify({
          event: {
            alexaUserReference: 'amzn1.account.user-1',
            profileId: 'profile-1',
            type: 'LINKED',
          },
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-alexa-webhook-secret': 'wrong-secret',
        },
        method: 'POST',
      }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: 'Invalid webhook secret.',
    });
    expect(adminClient.findLinkedUser).not.toHaveBeenCalled();
    expect(adminClient.upsertLinkedUser).not.toHaveBeenCalled();
  });
});
