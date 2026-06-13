import type {
  AlexaDeliveryStatus,
  AlexaLinkageStatus,
  AlexaNotificationPermissionStatus,
  AlexaNotificationSubscriptionStatus,
  AlexaReadinessStatus,
  AlexaWorkflowKey,
  EventType,
} from '@dreyk/shared/types/database';

export type SharedAlexaZoneState = 'ready' | 'incomplete' | 'failed';

export interface SharedAlexaZoneReadinessView {
  lastAttemptedAt: string | null;
  lastDeliveryStatus: AlexaDeliveryStatus | null;
  lastFailureReason: string | null;
  linkedProfileId: string | null;
  linkedUserId: string | null;
  linkedUserReference: string | null;
  linkageStatus: AlexaLinkageStatus | null;
  messageTemplate: string | null;
  nextAction: string;
  notificationPermissionStatus: AlexaNotificationPermissionStatus | null;
  notificationSubscriptionStatus: AlexaNotificationSubscriptionStatus | null;
  readinessStatus: AlexaReadinessStatus | null;
  state: SharedAlexaZoneState;
  statusLabel: string;
  triggerId: string | null;
  isTriggerActive: boolean;
  workflowKey: AlexaWorkflowKey | null;
}

export interface SharedGeofencingZoneView {
  alexa: SharedAlexaZoneReadinessView;
  createdAt: string;
  groupId: string;
  groupName: string | null;
  hasAlexaTrigger: boolean;
  id: string;
  isActive: boolean;
  latitude: number;
  longitude: number;
  name: string;
  radiusMeters: number;
  recentEventCount: number;
}

export interface SharedGeofencingEventView {
  distanceMeters: number;
  eventType: EventType;
  id: string;
  latitude: number;
  longitude: number;
  triggeredAt: string;
  userDisplayName: string | null;
  userId: string;
  zoneId: string;
  zoneName: string | null;
}
