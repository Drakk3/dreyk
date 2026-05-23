'use client';

import { LngLatBounds, type GeoJSONSource, type MapLayerMouseEvent } from 'maplibre-gl';
import * as React from 'react';

import { DataCard } from '@/components/thegridcn/data-card';
import { Map, MapControls, type MapViewport, fitMapBounds, useMap } from '@/components/mapcn/Map';
import { handleError } from '@/shared/lib/errors';

import type { SharedGeofencingEventView, SharedGeofencingZoneView } from './types';

const DEFAULT_VIEWPORT: MapViewport = {
  bearing: 0,
  center: [-74.08175, 4.60971],
  pitch: 0,
  zoom: 11,
};

const EVENTS_LAYER_ID = 'geofencing-events';
const EVENTS_SOURCE_ID = 'geofencing-events';
const ZONE_FILL_LAYER_ID = 'geofencing-zones-fill';
const ZONE_LINE_LAYER_ID = 'geofencing-zones-line';
const ZONE_LABEL_LAYER_ID = 'geofencing-zones-label';
const ZONE_SOURCE_ID = 'geofencing-zones';

interface GeofencingMapCanvasProps {
  events: SharedGeofencingEventView[];
  onSelectZone: (selectedZoneId: string | null) => void;
  selectedZoneId: string | null;
  zones: SharedGeofencingZoneView[];
}

interface GeofencingWorkspaceLayersProps {
  events: SharedGeofencingEventView[];
  onMapBoundaryError: (message: string | null) => void;
  onSelectZone: (selectedZoneId: string | null) => void;
  selectedZoneId: string | null;
  zones: SharedGeofencingZoneView[];
}

function canReadMapStyle(map: ReturnType<typeof useMap>['map']): map is NonNullable<ReturnType<typeof useMap>['map']> {
  return map !== null;
}

function isGeoJsonSource(source: unknown): source is GeoJSONSource {
  return typeof source === 'object' && source !== null && 'setData' in source;
}

function getMapSource(map: ReturnType<typeof useMap>['map'], sourceId: string): GeoJSONSource | null {
  if (!canReadMapStyle(map)) {
    return null;
  }

  try {
    const source = map.getSource(sourceId);
    return isGeoJsonSource(source) ? source : null;
  } catch {
    return null;
  }
}

function hasMapLayer(map: ReturnType<typeof useMap>['map'], layerId: string): boolean {
  if (!canReadMapStyle(map)) {
    return false;
  }

  try {
    return map.getLayer(layerId) !== undefined;
  } catch {
    return false;
  }
}

function hasStringId(properties: unknown): properties is { id: string } {
  return typeof properties === 'object' && properties !== null && 'id' in properties && typeof properties.id === 'string';
}

function cleanupGeofencingLayers(map: ReturnType<typeof useMap>['map']): void {
  if (!canReadMapStyle(map)) {
    return;
  }

  try {
    if (hasMapLayer(map, EVENTS_LAYER_ID)) {
      map.removeLayer(EVENTS_LAYER_ID);
    }

    if (getMapSource(map, EVENTS_SOURCE_ID) !== null) {
      map.removeSource(EVENTS_SOURCE_ID);
    }

    if (hasMapLayer(map, ZONE_LABEL_LAYER_ID)) {
      map.removeLayer(ZONE_LABEL_LAYER_ID);
    }

    if (hasMapLayer(map, ZONE_LINE_LAYER_ID)) {
      map.removeLayer(ZONE_LINE_LAYER_ID);
    }

    if (hasMapLayer(map, ZONE_FILL_LAYER_ID)) {
      map.removeLayer(ZONE_FILL_LAYER_ID);
    }

    if (getMapSource(map, ZONE_SOURCE_ID) !== null) {
      map.removeSource(ZONE_SOURCE_ID);
    }
  } catch (error: unknown) {
    handleError(error, 'GeofencingMapCanvas.cleanupGeofencingLayers');
  }
}

function buildSelectedZoneFeatureCollection(
  zones: SharedGeofencingZoneView[],
  selectedZoneId: string | null,
): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  return {
    type: 'FeatureCollection',
    features: zones.map((zone) => ({
      geometry: {
        coordinates: [[...createCirclePolygon(zone.latitude, zone.longitude, zone.radiusMeters)]],
        type: 'Polygon',
      },
      properties: {
        id: zone.id,
        isActive: zone.isActive,
        name: zone.name,
        selected: zone.id === selectedZoneId,
      },
      type: 'Feature',
    })),
  };
}

function buildEventFeatureCollection(events: SharedGeofencingEventView[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: events.map((event) => ({
      geometry: {
        coordinates: [event.longitude, event.latitude],
        type: 'Point',
      },
      properties: {
        eventType: event.eventType,
        id: event.id,
        userDisplayName: event.userDisplayName,
        zoneName: event.zoneName,
      },
      type: 'Feature',
    })),
  };
}

function ensureGeofencingLayers(map: NonNullable<ReturnType<typeof useMap>['map']>): void {
  if (getMapSource(map, ZONE_SOURCE_ID) === null) {
    map.addSource(ZONE_SOURCE_ID, {
      data: buildSelectedZoneFeatureCollection([], null),
      type: 'geojson',
    });

    map.addLayer({
      id: ZONE_FILL_LAYER_ID,
      paint: {
        'fill-color': ['case', ['boolean', ['get', 'selected'], false], '#4fd1c5', '#22c55e'],
        'fill-opacity': ['case', ['boolean', ['get', 'isActive'], false], 0.18, 0.08],
      },
      source: ZONE_SOURCE_ID,
      type: 'fill',
    });

    map.addLayer({
      id: ZONE_LINE_LAYER_ID,
      paint: {
        'line-color': ['case', ['boolean', ['get', 'selected'], false], '#67e8f9', '#22c55e'],
        'line-opacity': ['case', ['boolean', ['get', 'isActive'], false], 1, 0.5],
        'line-width': ['case', ['boolean', ['get', 'selected'], false], 3, 2],
      },
      source: ZONE_SOURCE_ID,
      type: 'line',
    });

    map.addLayer({
      id: ZONE_LABEL_LAYER_ID,
      layout: {
        'symbol-placement': 'point',
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Regular'],
        'text-size': 12,
      },
      paint: {
        'text-color': '#e2e8f0',
        'text-halo-color': '#020617',
        'text-halo-width': 1,
      },
      source: ZONE_SOURCE_ID,
      type: 'symbol',
    });
  }

  if (getMapSource(map, EVENTS_SOURCE_ID) === null) {
    map.addSource(EVENTS_SOURCE_ID, {
      data: buildEventFeatureCollection([]),
      type: 'geojson',
    });

    map.addLayer({
      id: EVENTS_LAYER_ID,
      paint: {
        'circle-color': ['case', ['==', ['get', 'eventType'], 'enter'], '#22c55e', '#f97316'],
        'circle-opacity': 0.95,
        'circle-radius': 5,
        'circle-stroke-color': '#020617',
        'circle-stroke-width': 1,
      },
      source: EVENTS_SOURCE_ID,
      type: 'circle',
    });
  }
}

function createCirclePolygon(latitude: number, longitude: number, radiusMeters: number): [number, number][] {
  const latitudeRadians = (latitude * Math.PI) / 180;
  const earthRadiusMeters = 6_378_137;
  const coordinates: [number, number][] = [];

  for (let step = 0; step <= 32; step += 1) {
    const angle = (step / 32) * Math.PI * 2;
    const deltaLatitude = (radiusMeters / earthRadiusMeters) * Math.sin(angle);
    const deltaLongitude =
      (radiusMeters / earthRadiusMeters) * Math.cos(angle) / Math.max(Math.cos(latitudeRadians), 0.00001);

    coordinates.push([
      longitude + (deltaLongitude * 180) / Math.PI,
      latitude + (deltaLatitude * 180) / Math.PI,
    ]);
  }

  return coordinates;
}

function GeofencingWorkspaceLayers({
  events,
  onMapBoundaryError,
  onSelectZone,
  selectedZoneId,
  zones,
}: GeofencingWorkspaceLayersProps): JSX.Element {
  const { isLoaded, map } = useMap();
  const hasFittedBoundsRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    if (!isLoaded || !canReadMapStyle(map)) {
      return;
    }

    const handleZoneClick = (event: MapLayerMouseEvent): void => {
      const properties = event.features?.[0]?.properties;

      if (hasStringId(properties)) {
        onSelectZone(properties.id);
      }
    };

    const handleZoneMouseEnter = (): void => {
      map.getCanvas().style.cursor = 'pointer';
    };

    const handleZoneMouseLeave = (): void => {
      map.getCanvas().style.cursor = '';
    };

    try {
      ensureGeofencingLayers(map);
      onMapBoundaryError(null);
    } catch (error: unknown) {
      handleError(error, 'GeofencingMapCanvas.ensureGeofencingLayers');
      onMapBoundaryError('Map rendering is temporarily unavailable for this snapshot.');
      cleanupGeofencingLayers(map);
      return;
    }

    map.on('click', ZONE_FILL_LAYER_ID, handleZoneClick);
    map.on('mouseenter', ZONE_FILL_LAYER_ID, handleZoneMouseEnter);
    map.on('mouseleave', ZONE_FILL_LAYER_ID, handleZoneMouseLeave);

    return () => {
      map.off('click', ZONE_FILL_LAYER_ID, handleZoneClick);
      map.off('mouseenter', ZONE_FILL_LAYER_ID, handleZoneMouseEnter);
      map.off('mouseleave', ZONE_FILL_LAYER_ID, handleZoneMouseLeave);

      cleanupGeofencingLayers(map);
    };
  }, [isLoaded, map, onMapBoundaryError, onSelectZone]);

  React.useEffect(() => {
    if (!isLoaded || !canReadMapStyle(map)) {
      return;
    }

    try {
      const zoneSource = getMapSource(map, ZONE_SOURCE_ID);
      const eventSource = getMapSource(map, EVENTS_SOURCE_ID);

      if (zoneSource === null || eventSource === null) {
        return;
      }

      zoneSource.setData(buildSelectedZoneFeatureCollection(zones, selectedZoneId));
      eventSource.setData(buildEventFeatureCollection(events));

      onMapBoundaryError(null);
    } catch (error: unknown) {
      handleError(error, 'GeofencingMapCanvas.syncGeofencingLayers');
      onMapBoundaryError('Map rendering is temporarily unavailable for this snapshot.');
    }
  }, [events, isLoaded, map, onMapBoundaryError, selectedZoneId, zones]);

  React.useEffect(() => {
    if (!isLoaded || !canReadMapStyle(map) || hasFittedBoundsRef.current || zones.length === 0) {
      return;
    }

    const firstZone = zones[0];

    if (firstZone === undefined) {
      return;
    }

    const bounds = zones.reduce((currentBounds, zone) => {
      currentBounds.extend([zone.longitude, zone.latitude]);
      return currentBounds;
    }, new LngLatBounds([firstZone.longitude, firstZone.latitude], [firstZone.longitude, firstZone.latitude]));

    fitMapBounds(map, bounds);
    hasFittedBoundsRef.current = true;
  }, [isLoaded, map, zones]);

  React.useEffect(() => {
    if (!isLoaded || !canReadMapStyle(map) || selectedZoneId === null) {
      return;
    }

    const selectedZone = zones.find((zone) => zone.id === selectedZoneId);

    if (selectedZone !== undefined) {
      map.flyTo({
        center: [selectedZone.longitude, selectedZone.latitude],
        duration: 250,
        zoom: Math.max(map.getZoom(), 13),
      });
    }
  }, [isLoaded, map, selectedZoneId, zones]);

  React.useEffect(() => {
    if (zones.length > 0) {
      return;
    }

    hasFittedBoundsRef.current = false;
  }, [zones.length]);

  return <></>;
}

function resolveInitialViewport(zones: SharedGeofencingZoneView[]): MapViewport {
  if (zones.length === 0) {
    return DEFAULT_VIEWPORT;
  }

  const firstZone = zones[0];

  if (firstZone === undefined) {
    return DEFAULT_VIEWPORT;
  }

  return {
    bearing: 0,
    center: [firstZone.longitude, firstZone.latitude],
    pitch: 0,
    zoom: 12,
  };
}

export function GeofencingMapCanvas({ events, onSelectZone, selectedZoneId, zones }: GeofencingMapCanvasProps): JSX.Element {
  const [mapErrorMessage, setMapErrorMessage] = React.useState<string | null>(null);
  const [viewport, setViewport] = React.useState<MapViewport>(() => resolveInitialViewport(zones));

  React.useEffect(() => {
    setViewport(resolveInitialViewport(zones));
  }, [zones]);

  return (
    <DataCard
      title="Map workspace"
      subtitle="Zone geometry + recent persisted events"
      headerRight={
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/50">
          {zones.length} zones · {events.length} events
        </div>
      }
    >
      <div className="relative h-[440px] p-3" data-testid="geofencing-map-canvas">
        <Map className="h-full min-h-[400px]" onViewportChange={setViewport} viewport={viewport}>
          <GeofencingWorkspaceLayers
            events={events}
            onMapBoundaryError={setMapErrorMessage}
            onSelectZone={onSelectZone}
            selectedZoneId={selectedZoneId}
            zones={zones}
          />
          <MapControls />
        </Map>

        {mapErrorMessage !== null ? (
          <div className="absolute inset-x-10 bottom-10 rounded border border-destructive/40 bg-background/90 px-4 py-3 backdrop-blur-sm">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-destructive">Map boundary degraded</div>
            <p className="mt-2 text-xs uppercase tracking-[0.08em] text-muted-foreground">{mapErrorMessage}</p>
          </div>
        ) : null}

        {zones.length === 0 ? (
          <div className="pointer-events-none absolute inset-x-10 top-10 rounded border border-border/50 bg-background/80 px-4 py-3 text-center backdrop-blur-sm">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">No zones in the current snapshot</div>
            <p className="mt-2 text-xs uppercase tracking-[0.08em] text-muted-foreground">
              The workspace stays operational even when Supabase returns zero rows.
            </p>
          </div>
        ) : null}
      </div>
    </DataCard>
  );
}
