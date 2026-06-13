import { describe, expect, it, vi } from 'vitest';

import {
  createAlexaTriggerHandler,
  type AlexaDeliveryAttemptRow,
  type AlexaLinkedUserRow,
  type AlexaProactiveEventsClient,
  type AlexaTriggerAdminClient,
  type AlexaTriggerRow,
  type LocationEventRow,
} from './handler';

function createAdminClientMock(): AlexaTriggerAdminClient {
  return {
    findDeliveryAttempt: vi.fn<AlexaTriggerAdminClient['findDeliveryAttempt']>(),
    findLinkedUserById: vi.fn<AlexaTriggerAdminClient['findLinkedUserById']>(),
    findLocationEventById: vi.fn<AlexaTriggerAdminClient['findLocationEventById']>(),
    findTriggerByZoneId: vi.fn<AlexaTriggerAdminClient['findTriggerByZoneId']>(),
    persistDeliveryAttempt: vi.fn<AlexaTriggerAdminClient['persistDeliveryAttempt']>(),
  };
}

function createProactiveEventsClientMock(): AlexaProactiveEventsClient {
  return {
    fetchAccessToken: vi.fn<AlexaProactiveEventsClient['fetchAccessToken']>(),
    sendProactiveEvent: vi.fn<AlexaProactiveEventsClient['sendProactiveEvent']>(),
  };
}

function createLocationEventRow(): LocationEventRow {
  return {
    distance_meters: 18,
    event_type: 'enter',
    id: 'event-1',
    latitude: 4.61,
    longitude: -74.08,
    triggered_at: '2026-06-06T13:00:00.000Z',
    user_id: 'user-1',
    zone_id: 'zone-1',
  };
}

function createTriggerRow(overrides: Partial<AlexaTriggerRow> = {}): AlexaTriggerRow {
  return {
    alexa_device_id: 'device-1',
    id: 'trigger-1',
    is_active: true,
    linked_user_id: 'linked-user-1',
    message_template: 'Welcome {{eventType}}',
    workflow_key: 'zone-enter-notification',
    zone_id: 'zone-1',
    ...overrides,
  };
}

function createLinkedUserRow(overrides: Partial<AlexaLinkedUserRow> = {}): AlexaLinkedUserRow {
  return {
    alexa_user_reference: 'amzn1.account.user-1',
    created_at: '2026-06-06T12:30:00.000Z',
    id: 'linked-user-1',
    last_skill_event_at: '2026-06-06T12:45:00.000Z',
    linkage_status: 'linked',
    locale: 'en-US',
    notification_permission_status: 'granted',
    notification_subscription_status: 'subscribed',
    profile_id: 'profile-1',
    readiness_status: 'ready',
    updated_at: '2026-06-06T12:45:00.000Z',
    ...overrides,
  };
}

function createAttemptRow(overrides: Partial<AlexaDeliveryAttemptRow> = {}): AlexaDeliveryAttemptRow {
  return {
    alexa_linked_user_id: 'linked-user-1',
    alexa_trigger_id: 'trigger-1',
    attempt_count: 1,
    created_at: '2026-06-06T13:01:00.000Z',
    delivered_at: null,
    failure_reason: null,
    id: 'attempt-1',
    idempotency_key: 'alexa:event-1:linked-user-1:zone-enter-notification',
    last_attempted_at: '2026-06-06T13:01:00.000Z',
    location_event_id: 'event-1',
    provider_message_id: null,
    status: 'pending',
    updated_at: '2026-06-06T13:01:00.000Z',
    workflow_key: 'zone-enter-notification',
    ...overrides,
  };
}

describe('alexa-trigger handler', () => {
  it('delivers a ready event and persists pending plus sent attempts', async () => {
    const adminClient = createAdminClientMock();
    const proactiveEventsClient = createProactiveEventsClientMock();
    const persistedInputs: Array<Parameters<AlexaTriggerAdminClient['persistDeliveryAttempt']>[0]> = [];

    vi.mocked(adminClient.findLocationEventById).mockResolvedValue({ errorMessage: null, row: createLocationEventRow() });
    vi.mocked(adminClient.findTriggerByZoneId).mockResolvedValue({ errorMessage: null, row: createTriggerRow() });
    vi.mocked(adminClient.findLinkedUserById).mockResolvedValue({ errorMessage: null, row: createLinkedUserRow() });
    vi.mocked(adminClient.findDeliveryAttempt).mockResolvedValue({ errorMessage: null, row: null });
    vi.mocked(adminClient.persistDeliveryAttempt).mockImplementation(async (input) => {
      persistedInputs.push(input);

      return {
        errorMessage: null,
        row: createAttemptRow({
          delivered_at: input.delivered_at ?? null,
          failure_reason: input.failure_reason ?? null,
          id: input.status === 'pending' ? 'attempt-pending' : 'attempt-sent',
          last_attempted_at: input.last_attempted_at,
          provider_message_id: input.provider_message_id ?? null,
          status: input.status,
        }),
      };
    });
    vi.mocked(proactiveEventsClient.fetchAccessToken).mockResolvedValue({ accessToken: 'token', errorMessage: null });
    vi.mocked(proactiveEventsClient.sendProactiveEvent).mockResolvedValue({ errorMessage: null, providerMessageId: 'provider-1' });

    const handler = createAlexaTriggerHandler({
      createAdminClient: () => adminClient,
      createProactiveEventsClient: () => proactiveEventsClient,
      triggerSecret: 'secret',
    });
    const response = await handler(
      new Request('http://localhost/functions/v1/alexa-trigger', {
        body: JSON.stringify({ locationEventId: 'event-1' }),
        headers: {
          'Content-Type': 'application/json',
          'x-alexa-trigger-secret': 'secret',
        },
        method: 'POST',
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      attemptId: 'attempt-sent',
      delivered: true,
      reason: null,
      status: 'sent',
    });
    expect(persistedInputs).toHaveLength(2);
    expect(persistedInputs[0]).toMatchObject({ status: 'pending' });
    expect(persistedInputs[1]).toMatchObject({ provider_message_id: 'provider-1', status: 'sent' });
    expect(proactiveEventsClient.sendProactiveEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: 'token',
        message: 'Welcome enter',
        userReference: 'amzn1.account.user-1',
      }),
    );
  });

  it('skips delivery when linkage readiness is not eligible and persists the reason', async () => {
    const adminClient = createAdminClientMock();
    const proactiveEventsClient = createProactiveEventsClientMock();

    vi.mocked(adminClient.findLocationEventById).mockResolvedValue({ errorMessage: null, row: createLocationEventRow() });
    vi.mocked(adminClient.findTriggerByZoneId).mockResolvedValue({ errorMessage: null, row: createTriggerRow() });
    vi.mocked(adminClient.findLinkedUserById).mockResolvedValue({
      errorMessage: null,
      row: createLinkedUserRow({
        notification_permission_status: 'denied',
        readiness_status: 'permission_missing',
      }),
    });
    vi.mocked(adminClient.findDeliveryAttempt).mockResolvedValue({ errorMessage: null, row: null });
    vi.mocked(adminClient.persistDeliveryAttempt).mockResolvedValue({
      errorMessage: null,
      row: createAttemptRow({
        failure_reason: 'Linked Alexa user has not granted notification permission.',
        id: 'attempt-skipped',
        status: 'skipped',
      }),
    });

    const handler = createAlexaTriggerHandler({
      createAdminClient: () => adminClient,
      createProactiveEventsClient: () => proactiveEventsClient,
      triggerSecret: 'secret',
    });
    const response = await handler(
      new Request('http://localhost/functions/v1/alexa-trigger', {
        body: JSON.stringify({ locationEventId: 'event-1' }),
        headers: {
          'Content-Type': 'application/json',
          'x-alexa-trigger-secret': 'secret',
        },
        method: 'POST',
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      attemptId: 'attempt-skipped',
      delivered: false,
      reason: 'Linked Alexa user has not granted notification permission.',
      status: 'skipped',
    });
    expect(proactiveEventsClient.fetchAccessToken).not.toHaveBeenCalled();
    expect(proactiveEventsClient.sendProactiveEvent).not.toHaveBeenCalled();
  });

  it('suppresses duplicate delivery after a sent attempt already exists', async () => {
    const adminClient = createAdminClientMock();
    const proactiveEventsClient = createProactiveEventsClientMock();

    vi.mocked(adminClient.findLocationEventById).mockResolvedValue({ errorMessage: null, row: createLocationEventRow() });
    vi.mocked(adminClient.findTriggerByZoneId).mockResolvedValue({ errorMessage: null, row: createTriggerRow() });
    vi.mocked(adminClient.findLinkedUserById).mockResolvedValue({ errorMessage: null, row: createLinkedUserRow() });
    vi.mocked(adminClient.findDeliveryAttempt).mockResolvedValue({
      errorMessage: null,
      row: createAttemptRow({
        delivered_at: '2026-06-06T13:02:00.000Z',
        id: 'attempt-sent',
        provider_message_id: 'provider-1',
        status: 'sent',
      }),
    });

    const handler = createAlexaTriggerHandler({
      createAdminClient: () => adminClient,
      createProactiveEventsClient: () => proactiveEventsClient,
      triggerSecret: 'secret',
    });
    const response = await handler(
      new Request('http://localhost/functions/v1/alexa-trigger', {
        body: JSON.stringify({ locationEventId: 'event-1' }),
        headers: {
          'Content-Type': 'application/json',
          'x-alexa-trigger-secret': 'secret',
        },
        method: 'POST',
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      attemptId: 'attempt-sent',
      delivered: true,
      reason: 'Duplicate delivery suppressed because this intent was already sent.',
      status: 'duplicate',
    });
    expect(adminClient.persistDeliveryAttempt).not.toHaveBeenCalled();
    expect(proactiveEventsClient.fetchAccessToken).not.toHaveBeenCalled();
    expect(proactiveEventsClient.sendProactiveEvent).not.toHaveBeenCalled();
  });
});
