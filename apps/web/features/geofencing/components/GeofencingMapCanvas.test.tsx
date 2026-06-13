import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { GeofencingEventView, GeofencingZoneView } from '../types';

import { GeofencingMapCanvas } from './GeofencingMapCanvas';

interface MockGeoJsonSource {
  setData: ReturnType<typeof vi.fn>;
}

interface MockMap {
  addLayer: ReturnType<typeof vi.fn>;
  addSource: ReturnType<typeof vi.fn>;
  flyTo: ReturnType<typeof vi.fn>;
  getCanvas: () => { style: { cursor: string } };
  getLayer: ReturnType<typeof vi.fn>;
  getSource: ReturnType<typeof vi.fn>;
  getZoom: () => number;
  off: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  removeLayer: ReturnType<typeof vi.fn>;
  removeSource: ReturnType<typeof vi.fn>;
}

const mapMocks = vi.hoisted(() => {
  const fitMapBounds = vi.fn();
  const handleError = vi.fn();

  function createMockMap(isSetupFailing = false): MockMap {
    const sources = new Map<string, MockGeoJsonSource>();
    const layers = new Set<string>();
    const canvas = { style: { cursor: '' } };

    return {
      addLayer: vi.fn((layer: { id: string }) => {
        layers.add(layer.id);
      }),
      addSource: vi.fn((sourceId: string) => {
        if (isSetupFailing) {
          throw new Error('style load failed');
        }

        sources.set(sourceId, { setData: vi.fn() });
      }),
      flyTo: vi.fn(),
      getCanvas: () => canvas,
      getLayer: vi.fn((layerId: string) => (layers.has(layerId) ? { id: layerId } : undefined)),
      getSource: vi.fn((sourceId: string) => sources.get(sourceId) ?? undefined),
      getZoom: () => 11,
      off: vi.fn(),
      on: vi.fn(),
      removeLayer: vi.fn((layerId: string) => {
        layers.delete(layerId);
      }),
      removeSource: vi.fn((sourceId: string) => {
        sources.delete(sourceId);
      }),
    };
  }

  return {
    createMockMap,
    currentMap: createMockMap(false),
    fitMapBounds,
    handleError,
  };
});

vi.mock('@/components/mapcn/Map', () => ({
  Map: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  MapControls: () => <div>Map controls</div>,
  fitMapBounds: mapMocks.fitMapBounds,
  useMap: () => ({ isLoaded: true, map: mapMocks.currentMap }),
}));

vi.mock('@/shared/lib/errors', () => ({
  handleError: mapMocks.handleError,
}));

function createZone(): GeofencingZoneView {
  return {
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
      state: 'incomplete' as const,
      statusLabel: 'Linked user required',
      triggerId: 'trigger-1',
      isTriggerActive: true,
      workflowKey: 'zone-enter-notification' as const,
    },
    createdAt: '2026-05-17T10:00:00.000Z',
    groupId: 'group-1',
    groupName: 'Alpha',
    hasAlexaTrigger: true,
    id: 'zone-1',
    isActive: true,
    latitude: 4.61,
    longitude: -74.08,
    name: 'Home',
    radiusMeters: 80,
    recentEventCount: 1,
  };
}

function createEvent(): GeofencingEventView {
  return {
    distanceMeters: 18,
    eventType: 'enter' as const,
    id: 'event-1',
    latitude: 4.61,
    longitude: -74.08,
    triggeredAt: '2026-05-17T12:00:00.000Z',
    userDisplayName: 'Ana Ops',
    userId: 'user-1',
    zoneId: 'zone-1',
    zoneName: 'Home',
  };
}

describe('GeofencingMapCanvas', () => {
  it('cleans up feature-owned layers and sources on unmount', () => {
    mapMocks.currentMap = mapMocks.createMockMap(false);

    const { unmount } = render(
      <GeofencingMapCanvas
        events={[createEvent()]}
        onSelectZone={vi.fn<(selectedZoneId: string | null) => void>()}
        selectedZoneId="zone-1"
        zones={[createZone()]}
      />,
    );

    unmount();

    expect(mapMocks.currentMap.off).toHaveBeenCalledTimes(3);
    expect(mapMocks.currentMap.removeLayer).toHaveBeenCalledWith('geofencing-events');
    expect(mapMocks.currentMap.removeLayer).toHaveBeenCalledWith('geofencing-zones-label');
    expect(mapMocks.currentMap.removeLayer).toHaveBeenCalledWith('geofencing-zones-line');
    expect(mapMocks.currentMap.removeLayer).toHaveBeenCalledWith('geofencing-zones-fill');
    expect(mapMocks.currentMap.removeSource).toHaveBeenCalledWith('geofencing-events');
    expect(mapMocks.currentMap.removeSource).toHaveBeenCalledWith('geofencing-zones');
  });

  it('normalizes setup failures into a bounded feature error state', async () => {
    mapMocks.currentMap = mapMocks.createMockMap(true);

    render(
      <GeofencingMapCanvas
        events={[createEvent()]}
        onSelectZone={vi.fn<(selectedZoneId: string | null) => void>()}
        selectedZoneId="zone-1"
        zones={[createZone()]}
      />,
    );

    expect(await screen.findByText('Map boundary degraded')).toBeInTheDocument();
    expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
    expect(mapMocks.handleError).toHaveBeenCalled();
  });
});
