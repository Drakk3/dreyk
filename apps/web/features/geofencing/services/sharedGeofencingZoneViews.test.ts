import { describe, expect, it } from 'vitest';

import type {
  AlexaDeliveryAttemptRow,
  AlexaLinkedUserRow,
  AlexaTriggerRow,
  GroupRow,
  LocationEventRow,
  ZoneRow,
} from '@dreyk/shared/types/database';

import { createSharedGeofencingZoneViews } from '@/shared/geofencing/geofencingZoneViews';

const GROUPS: GroupRow[] = [
  {
    created_at: '2026-05-18T08:00:00.000Z',
    created_by: '11111111-1111-4111-8111-111111111111',
    description: null,
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    name: 'Alpha',
  },
];

const ZONES: ZoneRow[] = [
  {
    created_at: '2026-05-18T09:00:00.000Z',
    created_by: '11111111-1111-4111-8111-111111111111',
    group_id: GROUPS[0]!.id,
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    is_active: true,
    latitude: 4.61,
    longitude: -74.08,
    name: 'Home',
    radius_meters: 120,
  },
];

const TRIGGERS: AlexaTriggerRow[] = [
  {
    alexa_device_id: 'device-1',
    id: 'trigger-1',
    is_active: true,
    linked_user_id: null,
    message_template: 'Welcome home',
    workflow_key: 'zone-enter-notification',
    zone_id: ZONES[0]!.id,
  },
];

const LINKED_USERS: AlexaLinkedUserRow[] = [
  {
    alexa_user_reference: 'amzn1.account.user-1',
    created_at: '2026-05-18T08:30:00.000Z',
    id: 'linked-user-1',
    last_skill_event_at: '2026-05-18T08:45:00.000Z',
    linkage_status: 'linked',
    locale: 'en-US',
    notification_permission_status: 'granted',
    notification_subscription_status: 'subscribed',
    profile_id: 'profile-1',
    readiness_status: 'ready',
    updated_at: '2026-05-18T08:45:00.000Z',
  },
];

const DELIVERY_ATTEMPTS: AlexaDeliveryAttemptRow[] = [];

const EVENTS: LocationEventRow[] = [
  {
    distance_meters: 10,
    event_type: 'enter',
    id: 'event-1',
    latitude: 4.61,
    longitude: -74.08,
    triggered_at: '2026-05-18T09:10:00.000Z',
    user_id: 'user-1',
    zone_id: ZONES[0]!.id,
  },
  {
    distance_meters: 11,
    event_type: 'exit',
    id: 'event-2',
    latitude: 4.61,
    longitude: -74.08,
    triggered_at: '2026-05-18T09:12:00.000Z',
    user_id: 'user-2',
    zone_id: ZONES[0]!.id,
  },
];

describe('createSharedGeofencingZoneViews', () => {
  it('maps persisted zone rows into reusable read-only views', () => {
    expect(
      createSharedGeofencingZoneViews({
        alexaDeliveryAttempts: DELIVERY_ATTEMPTS,
        alexaLinkedUsers: LINKED_USERS,
        alexaTriggers: TRIGGERS,
        groups: GROUPS,
        recentEvents: EVENTS,
        zones: ZONES,
      }),
    ).toEqual([
      {
        alexa: {
          lastAttemptedAt: null,
          lastDeliveryStatus: null,
          lastFailureReason: null,
          linkedProfileId: null,
          linkedUserId: null,
          linkedUserReference: null,
          linkageStatus: null,
          messageTemplate: 'Welcome home',
          nextAction: 'Assign a persisted Alexa linked user to this trigger.',
          notificationPermissionStatus: null,
          notificationSubscriptionStatus: null,
          readinessStatus: null,
          state: 'incomplete',
          statusLabel: 'Linked user required',
          triggerId: 'trigger-1',
          isTriggerActive: true,
          workflowKey: 'zone-enter-notification',
        },
        createdAt: '2026-05-18T09:00:00.000Z',
        groupId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        groupName: 'Alpha',
        hasAlexaTrigger: true,
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        isActive: true,
        latitude: 4.61,
        longitude: -74.08,
        name: 'Home',
        radiusMeters: 120,
        recentEventCount: 2,
      },
    ]);
  });

  it('surfaces persisted delivery failures as actionable failed readiness state', () => {
    const zoneView = createSharedGeofencingZoneViews({
      alexaDeliveryAttempts: [
        {
          alexa_linked_user_id: 'linked-user-1',
          alexa_trigger_id: 'trigger-1',
          attempt_count: 2,
          created_at: '2026-05-18T09:16:00.000Z',
          delivered_at: null,
          failure_reason: 'Amazon timeout',
          id: 'attempt-1',
          idempotency_key: 'alexa:event-1:linked-user-1:zone-enter-notification',
          last_attempted_at: '2026-05-18T09:16:00.000Z',
          location_event_id: 'event-1',
          provider_message_id: null,
          status: 'failed',
          updated_at: '2026-05-18T09:16:00.000Z',
          workflow_key: 'zone-enter-notification',
        },
      ],
      alexaLinkedUsers: LINKED_USERS,
      alexaTriggers: [{ ...TRIGGERS[0]!, linked_user_id: 'linked-user-1' }],
      groups: GROUPS,
      recentEvents: EVENTS,
      zones: ZONES,
    })[0];

    expect(zoneView?.alexa).toMatchObject({
      lastFailureReason: 'Amazon timeout',
      linkedUserId: 'linked-user-1',
      nextAction: 'Amazon timeout',
      state: 'failed',
      statusLabel: 'Delivery failed',
    });
  });
});
