import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Map, type MapViewport } from '@/components/mapcn/Map';

interface MockMapInstance {
  getBearing: () => number;
  getCenter: () => { lat: number; lng: number };
  getPitch: () => number;
  getZoom: () => number;
  isStyleLoaded: () => boolean;
  jumpTo: (nextViewport: { bearing: number; center: [number, number]; pitch: number; zoom: number }) => void;
  off: (...args: unknown[]) => void;
  on: (...args: unknown[]) => void;
  remove: () => void;
  setStyle: (styleUrl: string) => void;
}

const maplibreMocks = vi.hoisted(() => {
  const instances: MockMapInstance[] = [];
  const constructorCalls = vi.fn();

  class MockMap {
    private readonly instance: MockMapInstance;

    public constructor(options: { bearing: number; center: [number, number]; pitch: number; zoom: number }) {
      constructorCalls();

      let center = { lat: options.center[1], lng: options.center[0] };
      let bearing = options.bearing;
      let pitch = options.pitch;
      let zoom = options.zoom;

      this.instance = {
        getBearing: () => bearing,
        getCenter: () => center,
        getPitch: () => pitch,
        getZoom: () => zoom,
        isStyleLoaded: () => true,
        jumpTo: vi.fn((nextViewport: { bearing: number; center: [number, number]; pitch: number; zoom: number }) => {
          bearing = nextViewport.bearing;
          center = { lat: nextViewport.center[1], lng: nextViewport.center[0] };
          pitch = nextViewport.pitch;
          zoom = nextViewport.zoom;
        }),
        off: vi.fn(),
        on: vi.fn(),
        remove: vi.fn(),
        setStyle: vi.fn(),
      };

      instances.push(this.instance);
    }

    public getBearing(): number {
      return this.instance.getBearing();
    }

    public getCenter(): { lat: number; lng: number } {
      return this.instance.getCenter();
    }

    public getPitch(): number {
      return this.instance.getPitch();
    }

    public getZoom(): number {
      return this.instance.getZoom();
    }

    public isStyleLoaded(): boolean {
      return this.instance.isStyleLoaded();
    }

    public jumpTo(nextViewport: { bearing: number; center: [number, number]; pitch: number; zoom: number }): void {
      this.instance.jumpTo(nextViewport);
    }

    public off(...args: unknown[]): void {
      this.instance.off(...args);
    }

    public on(...args: unknown[]): void {
      this.instance.on(...args);
    }

    public remove(): void {
      this.instance.remove();
    }

    public setStyle(styleUrl: string): void {
      this.instance.setStyle(styleUrl);
    }
  }

  return {
    constructorCalls,
    instances,
    MapConstructor: MockMap,
  };
});

vi.mock('maplibre-gl', () => ({
  default: {
    Map: maplibreMocks.MapConstructor,
  },
}));

function createViewport(): MapViewport {
  return {
    bearing: 0,
    center: [-74.08175, 4.60971],
    pitch: 0,
    zoom: 11,
  };
}

describe('Map lifecycle', () => {
  it('keeps one map instance alive across viewport prop updates', () => {
    const { rerender, unmount } = render(<Map viewport={createViewport()} />);

    expect(maplibreMocks.constructorCalls).toHaveBeenCalledTimes(1);

    rerender(
      <Map
        viewport={{
          bearing: 0,
          center: [-74.09, 4.61],
          pitch: 0,
          zoom: 13,
        }}
      />,
    );

    expect(maplibreMocks.constructorCalls).toHaveBeenCalledTimes(1);
    expect(maplibreMocks.instances[0]?.jumpTo).toHaveBeenCalledTimes(1);

    unmount();

    expect(maplibreMocks.instances[0]?.remove).toHaveBeenCalledTimes(1);
  });
});
