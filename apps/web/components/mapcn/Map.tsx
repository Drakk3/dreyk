'use client';

import { Minus, Plus } from 'lucide-react';
import maplibregl, { LngLatBoundsLike, type MapOptions } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DEFAULT_STYLE_URL = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export interface MapViewport {
  bearing: number;
  center: [number, number];
  pitch: number;
  zoom: number;
}

interface MapContextValue {
  isLoaded: boolean;
  map: maplibregl.Map | null;
}

interface MapProps extends Omit<MapOptions, 'bearing' | 'center' | 'container' | 'pitch' | 'style' | 'zoom'> {
  children?: React.ReactNode;
  className?: string;
  onViewportChange?: (viewport: MapViewport) => void;
  styleUrl?: string;
  viewport: MapViewport;
}

interface MapControlsProps {
  className?: string;
}

const MapContext = React.createContext<MapContextValue | null>(null);

function getViewport(map: maplibregl.Map): MapViewport {
  const center = map.getCenter();

  return {
    bearing: map.getBearing(),
    center: [center.lng, center.lat],
    pitch: map.getPitch(),
    zoom: map.getZoom(),
  };
}

export function useMap(): MapContextValue {
  const context = React.useContext(MapContext);

  if (context === null) {
    throw new Error('useMap must be used inside Map.');
  }

  return context;
}

export function Map({ children, className, onViewportChange, styleUrl = DEFAULT_STYLE_URL, viewport, ...props }: MapProps): JSX.Element {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const initialViewportRef = React.useRef<MapViewport>(viewport);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const onViewportChangeRef = React.useRef<typeof onViewportChange>(onViewportChange);
  const initialOptionsRef = React.useRef<Omit<MapProps, 'children' | 'className' | 'onViewportChange' | 'styleUrl' | 'viewport'>>(
    props,
  );
  const styleUrlRef = React.useRef<string>(styleUrl);
  const internalViewportUpdateRef = React.useRef<boolean>(false);
  const [mapInstance, setMapInstance] = React.useState<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = React.useState<boolean>(false);

  onViewportChangeRef.current = onViewportChange;

  React.useEffect(() => {
    if (containerRef.current === null || mapRef.current !== null) {
      return;
    }

    const map = new maplibregl.Map({
      attributionControl: false,
      bearing: initialViewportRef.current.bearing,
      center: initialViewportRef.current.center,
      container: containerRef.current,
      pitch: initialViewportRef.current.pitch,
      renderWorldCopies: false,
      style: styleUrl,
      zoom: initialViewportRef.current.zoom,
      ...initialOptionsRef.current,
    });

    const handleLoad = (): void => {
      setIsLoaded(true);
    };

    const handleStyleLoad = (): void => {
      setIsLoaded(true);
    };

    const handleMove = (): void => {
      if (internalViewportUpdateRef.current) {
        return;
      }

      onViewportChangeRef.current?.(getViewport(map));
    };

    map.on('load', handleLoad);
    map.on('style.load', handleStyleLoad);
    map.on('move', handleMove);
    mapRef.current = map;
    setMapInstance(map);

    return () => {
      map.off('load', handleLoad);
      map.off('style.load', handleStyleLoad);
      map.off('move', handleMove);
      map.remove();
      mapRef.current = null;
      setMapInstance(null);
      setIsLoaded(false);
    };
  }, []);

  React.useEffect(() => {
    const map = mapRef.current;

    if (map === null || styleUrlRef.current === styleUrl) {
      return;
    }

    styleUrlRef.current = styleUrl;
    setIsLoaded(false);
    map.setStyle(styleUrl);
  }, [styleUrl]);

  React.useEffect(() => {
    const map = mapRef.current;

    if (map === null) {
      return;
    }

    const currentViewport = getViewport(map);
    const hasChanged =
      currentViewport.bearing !== viewport.bearing ||
      currentViewport.center[0] !== viewport.center[0] ||
      currentViewport.center[1] !== viewport.center[1] ||
      currentViewport.pitch !== viewport.pitch ||
      currentViewport.zoom !== viewport.zoom;

    if (!hasChanged) {
      return;
    }

    internalViewportUpdateRef.current = true;
    map.jumpTo({
      bearing: viewport.bearing,
      center: viewport.center,
      pitch: viewport.pitch,
      zoom: viewport.zoom,
    });
    internalViewportUpdateRef.current = false;
  }, [viewport]);

  const contextValue = React.useMemo<MapContextValue>(() => {
    return {
      isLoaded,
      map: mapInstance,
    };
  }, [isLoaded, mapInstance]);

  return (
    <MapContext.Provider value={contextValue}>
      <div className={cn('relative h-full w-full overflow-hidden rounded border border-border/40', className)}>
        <div ref={containerRef} className="h-full w-full" />
        {!isLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Loading map</div>
          </div>
        ) : null}
        {children}
      </div>
    </MapContext.Provider>
  );
}

export function MapControls({ className }: MapControlsProps): JSX.Element {
  const { isLoaded, map } = useMap();

  const handleZoomIn = React.useCallback((): void => {
    map?.zoomIn({ duration: 250 });
  }, [map]);

  const handleZoomOut = React.useCallback((): void => {
    map?.zoomOut({ duration: 250 });
  }, [map]);

  if (!isLoaded) {
    return <></>;
  }

  return (
    <div className={cn('absolute bottom-4 right-4 z-10 flex flex-col gap-2', className)}>
      <Button aria-label="Zoom in" className="h-8 w-8 p-0" onClick={handleZoomIn} size="icon-sm" type="button" variant="outline">
        <Plus className="size-4" />
      </Button>
      <Button aria-label="Zoom out" className="h-8 w-8 p-0" onClick={handleZoomOut} size="icon-sm" type="button" variant="outline">
        <Minus className="size-4" />
      </Button>
    </div>
  );
}

export function fitMapBounds(map: maplibregl.Map, bounds: LngLatBoundsLike): void {
  map.fitBounds(bounds, { duration: 0, padding: 48 });
}
