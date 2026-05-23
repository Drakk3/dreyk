import type { EventType } from '@dreyk/shared/types/database';

export interface SharedGeofencingZoneView {
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
