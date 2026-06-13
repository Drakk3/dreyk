import type {
  AlexaDeliveryAttemptRow,
  AlexaLinkedUserRow,
  AlexaReadinessStatus,
  AlexaTriggerRow,
  GroupRow,
  LocationEventRow,
  ZoneRow,
} from '@dreyk/shared/types/database';

import type { SharedGeofencingZoneView } from './types';

export interface CreateSharedGeofencingZoneViewsParams {
  alexaDeliveryAttempts: AlexaDeliveryAttemptRow[];
  alexaLinkedUsers: AlexaLinkedUserRow[];
  alexaTriggers: AlexaTriggerRow[];
  groups: GroupRow[];
  recentEvents: LocationEventRow[];
  zones: ZoneRow[];
}

interface ReadinessCopy {
  nextAction: string;
  state: 'failed' | 'incomplete' | 'ready';
  statusLabel: string;
}

function createGroupByIdMap(groups: GroupRow[]): Map<string, GroupRow> {
  return new Map(groups.map((group) => [group.id, group]));
}

function createLinkedUserByIdMap(alexaLinkedUsers: AlexaLinkedUserRow[]): Map<string, AlexaLinkedUserRow> {
  return new Map(alexaLinkedUsers.map((linkedUser) => [linkedUser.id, linkedUser]));
}

function compareAttemptTimestamps(leftAttempt: AlexaDeliveryAttemptRow, rightAttempt: AlexaDeliveryAttemptRow): number {
  const leftTimestamp = leftAttempt.last_attempted_at ?? leftAttempt.updated_at ?? leftAttempt.created_at;
  const rightTimestamp = rightAttempt.last_attempted_at ?? rightAttempt.updated_at ?? rightAttempt.created_at;

  return new Date(leftTimestamp).getTime() - new Date(rightTimestamp).getTime();
}

function createLatestAttemptByTriggerIdMap(alexaDeliveryAttempts: AlexaDeliveryAttemptRow[]): Map<string, AlexaDeliveryAttemptRow> {
  const attemptsByTriggerId = new Map<string, AlexaDeliveryAttemptRow>();

  for (const attempt of alexaDeliveryAttempts) {
    const currentAttempt = attemptsByTriggerId.get(attempt.alexa_trigger_id);

    if (currentAttempt === undefined || compareAttemptTimestamps(attempt, currentAttempt) > 0) {
      attemptsByTriggerId.set(attempt.alexa_trigger_id, attempt);
    }
  }

  return attemptsByTriggerId;
}

function createTriggerByZoneIdMap(alexaTriggers: AlexaTriggerRow[]): Map<string, AlexaTriggerRow> {
  const triggersByZoneId = new Map<string, AlexaTriggerRow>();

  for (const trigger of alexaTriggers) {
    const currentTrigger = triggersByZoneId.get(trigger.zone_id);

    if (currentTrigger === undefined || (currentTrigger.is_active === false && trigger.is_active)) {
      triggersByZoneId.set(trigger.zone_id, trigger);
    }
  }

  return triggersByZoneId;
}

function createRecentEventCountByZoneMap(recentEvents: LocationEventRow[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const event of recentEvents) {
    counts.set(event.zone_id, (counts.get(event.zone_id) ?? 0) + 1);
  }

  return counts;
}

function resolveReadinessCopy(readinessStatus: AlexaReadinessStatus): ReadinessCopy {
  if (readinessStatus === 'ready') {
    return { nextAction: 'No action required.', state: 'ready', statusLabel: 'Ready' };
  }

  if (readinessStatus === 'permission_missing') {
    return {
      nextAction: 'Grant Alexa notification permission for the linked user.',
      state: 'incomplete',
      statusLabel: 'Permission missing',
    };
  }

  if (readinessStatus === 'unsubscribed') {
    return {
      nextAction: 'Re-enable Proactive Event notification subscription in Alexa.',
      state: 'incomplete',
      statusLabel: 'Subscription inactive',
    };
  }

  if (readinessStatus === 'unlinked') {
    return {
      nextAction: 'Re-link the Dreyk account from the Alexa skill.',
      state: 'incomplete',
      statusLabel: 'Account unlinked',
    };
  }

  if (readinessStatus === 'failed') {
    return {
      nextAction: 'Inspect the stored Alexa linkage state and re-link the account.',
      state: 'failed',
      statusLabel: 'Linkage failed',
    };
  }

  return {
    nextAction: 'Finish account linking and notification opt-in in Alexa.',
    state: 'incomplete',
    statusLabel: 'Pending setup',
  };
}

function createAlexaReadinessView(
  zoneId: string,
  triggerByZoneId: Map<string, AlexaTriggerRow>,
  linkedUserById: Map<string, AlexaLinkedUserRow>,
  latestAttemptByTriggerId: Map<string, AlexaDeliveryAttemptRow>,
): SharedGeofencingZoneView['alexa'] {
  const trigger = triggerByZoneId.get(zoneId) ?? null;

  if (trigger === null) {
    return {
      lastAttemptedAt: null,
      lastDeliveryStatus: null,
      lastFailureReason: null,
      linkedProfileId: null,
      linkedUserId: null,
      linkedUserReference: null,
      linkageStatus: null,
      messageTemplate: null,
      nextAction: 'Create an Alexa trigger for this zone before treating it as voice-ready.',
      notificationPermissionStatus: null,
      notificationSubscriptionStatus: null,
      readinessStatus: null,
      state: 'incomplete',
      statusLabel: 'Not configured',
      triggerId: null,
      isTriggerActive: false,
      workflowKey: null,
    };
  }

  const latestAttempt = latestAttemptByTriggerId.get(trigger.id) ?? null;

  if (trigger.is_active === false) {
    return {
      lastAttemptedAt: latestAttempt?.last_attempted_at ?? null,
      lastDeliveryStatus: latestAttempt?.status ?? null,
      lastFailureReason: latestAttempt?.failure_reason ?? null,
      linkedProfileId: null,
      linkedUserId: trigger.linked_user_id,
      linkedUserReference: null,
      linkageStatus: null,
      messageTemplate: trigger.message_template,
      nextAction: 'Activate this Alexa trigger before dispatch is allowed.',
      notificationPermissionStatus: null,
      notificationSubscriptionStatus: null,
      readinessStatus: null,
      state: 'incomplete',
      statusLabel: 'Trigger inactive',
      triggerId: trigger.id,
      isTriggerActive: false,
      workflowKey: trigger.workflow_key,
    };
  }

  if (latestAttempt?.status === 'failed') {
    const linkedUser = trigger.linked_user_id === null ? null : linkedUserById.get(trigger.linked_user_id) ?? null;

    return {
      lastAttemptedAt: latestAttempt.last_attempted_at,
      lastDeliveryStatus: latestAttempt.status,
      lastFailureReason: latestAttempt.failure_reason,
      linkedProfileId: linkedUser?.profile_id ?? null,
      linkedUserId: trigger.linked_user_id,
      linkedUserReference: linkedUser?.alexa_user_reference ?? null,
      linkageStatus: linkedUser?.linkage_status ?? null,
      messageTemplate: trigger.message_template,
      nextAction: latestAttempt.failure_reason ?? 'Inspect the last failed delivery attempt before retrying.',
      notificationPermissionStatus: linkedUser?.notification_permission_status ?? null,
      notificationSubscriptionStatus: linkedUser?.notification_subscription_status ?? null,
      readinessStatus: linkedUser?.readiness_status ?? null,
      state: 'failed',
      statusLabel: 'Delivery failed',
      triggerId: trigger.id,
      isTriggerActive: true,
      workflowKey: trigger.workflow_key,
    };
  }

  if (trigger.linked_user_id === null) {
    return {
      lastAttemptedAt: latestAttempt?.last_attempted_at ?? null,
      lastDeliveryStatus: latestAttempt?.status ?? null,
      lastFailureReason: latestAttempt?.failure_reason ?? null,
      linkedProfileId: null,
      linkedUserId: null,
      linkedUserReference: null,
      linkageStatus: null,
      messageTemplate: trigger.message_template,
      nextAction: 'Assign a persisted Alexa linked user to this trigger.',
      notificationPermissionStatus: null,
      notificationSubscriptionStatus: null,
      readinessStatus: null,
      state: 'incomplete',
      statusLabel: 'Linked user required',
      triggerId: trigger.id,
      isTriggerActive: true,
      workflowKey: trigger.workflow_key,
    };
  }

  const linkedUser = linkedUserById.get(trigger.linked_user_id) ?? null;

  if (linkedUser === null) {
    return {
      lastAttemptedAt: latestAttempt?.last_attempted_at ?? null,
      lastDeliveryStatus: latestAttempt?.status ?? null,
      lastFailureReason: latestAttempt?.failure_reason ?? null,
      linkedProfileId: null,
      linkedUserId: trigger.linked_user_id,
      linkedUserReference: null,
      linkageStatus: null,
      messageTemplate: trigger.message_template,
      nextAction: 'Reconnect this trigger to a valid persisted Alexa linked user.',
      notificationPermissionStatus: null,
      notificationSubscriptionStatus: null,
      readinessStatus: null,
      state: 'failed',
      statusLabel: 'Linked user missing',
      triggerId: trigger.id,
      isTriggerActive: true,
      workflowKey: trigger.workflow_key,
    };
  }

  const readinessCopy = resolveReadinessCopy(linkedUser.readiness_status);

  return {
    lastAttemptedAt: latestAttempt?.last_attempted_at ?? null,
    lastDeliveryStatus: latestAttempt?.status ?? null,
    lastFailureReason: latestAttempt?.failure_reason ?? null,
    linkedProfileId: linkedUser.profile_id,
    linkedUserId: linkedUser.id,
    linkedUserReference: linkedUser.alexa_user_reference,
    linkageStatus: linkedUser.linkage_status,
    messageTemplate: trigger.message_template,
    nextAction: readinessCopy.nextAction,
    notificationPermissionStatus: linkedUser.notification_permission_status,
    notificationSubscriptionStatus: linkedUser.notification_subscription_status,
    readinessStatus: linkedUser.readiness_status,
    state: readinessCopy.state,
    statusLabel: readinessCopy.statusLabel,
    triggerId: trigger.id,
    isTriggerActive: true,
    workflowKey: trigger.workflow_key,
  };
}

export function createSharedGeofencingZoneViews({
  alexaDeliveryAttempts,
  alexaLinkedUsers,
  alexaTriggers,
  groups,
  recentEvents,
  zones,
}: CreateSharedGeofencingZoneViewsParams): SharedGeofencingZoneView[] {
  const groupById = createGroupByIdMap(groups);
  const linkedUserById = createLinkedUserByIdMap(alexaLinkedUsers);
  const latestAttemptByTriggerId = createLatestAttemptByTriggerIdMap(alexaDeliveryAttempts);
  const recentEventCountByZone = createRecentEventCountByZoneMap(recentEvents);
  const triggerByZoneId = createTriggerByZoneIdMap(alexaTriggers);

  return zones.map((zone) => {
    const group = groupById.get(zone.group_id);
    const alexa = createAlexaReadinessView(zone.id, triggerByZoneId, linkedUserById, latestAttemptByTriggerId);

    return {
      alexa,
      createdAt: zone.created_at,
      groupId: zone.group_id,
      groupName: group?.name ?? null,
      hasAlexaTrigger: alexa.isTriggerActive,
      id: zone.id,
      isActive: zone.is_active,
      latitude: zone.latitude,
      longitude: zone.longitude,
      name: zone.name,
      radiusMeters: zone.radius_meters,
      recentEventCount: recentEventCountByZone.get(zone.id) ?? 0,
    };
  });
}
