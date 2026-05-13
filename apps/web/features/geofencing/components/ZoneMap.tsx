'use client';

import { Button } from '@/components/ui/button';
import { Brackets } from '@/shared/components/primitives/Brackets';

import type { DashboardProfile, DashboardUserPin, DashboardZone } from '../types';

interface ZoneMapProps {
  onSelect: (id: string) => void;
  profiles: DashboardProfile[];
  selectedZone: string;
  userPins: DashboardUserPin[];
  zones: DashboardZone[];
}

export function ZoneMap({
  onSelect,
  profiles,
  selectedZone,
  userPins,
  zones,
}: ZoneMapProps): JSX.Element {
  return (
    <div className="relative h-[380px] map-grid overflow-hidden rounded">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, color-mix(in oklch, var(--primary) 8%, transparent) 0%, transparent 55%)',
        }}
      />

      <div
        className="pointer-events-none absolute inset-x-0 h-px bg-primary/40 scan-sweep"
        style={{ boxShadow: '0 0 14px var(--primary)' }}
      />

      <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {userPins
          .filter((pin) => pin.zone !== null)
          .map((pin) => {
            const zone = zones.find((zoneItem) => zoneItem.id === pin.zone);

            if (zone === undefined) {
              return null;
            }

            return (
              <line
                key={pin.id}
                x1={pin.x}
                y1={pin.y}
                x2={zone.x}
                y2={zone.y}
                stroke="color-mix(in oklch, var(--primary) 30%, transparent)"
                strokeWidth="0.15"
                strokeDasharray="0.6 0.4"
              />
            );
          })}

        {zones.map((zone) => {
          const isSelected = selectedZone === zone.id;
          const stroke = !zone.active
            ? 'var(--muted-foreground)'
            : isSelected
              ? 'var(--accent)'
              : 'var(--primary)';
          const opacity = !zone.active ? 0.35 : isSelected ? 1 : 0.7;

          return (
            <g
              key={zone.id}
              onClick={() => onSelect(zone.id)}
              style={{ cursor: 'pointer' }}
              opacity={opacity}
            >
              <circle
                cx={zone.x}
                cy={zone.y}
                r={zone.r / 22}
                fill={stroke}
                fillOpacity={isSelected ? 0.12 : 0.06}
                stroke={stroke}
                strokeWidth={isSelected ? '0.35' : '0.18'}
              />
              {isSelected ? (
                <circle
                  cx={zone.x}
                  cy={zone.y}
                  r={zone.r / 22}
                  fill="none"
                  stroke={stroke}
                  strokeWidth="0.15"
                  strokeDasharray="0.4 0.3"
                >
                  <animate
                    attributeName="r"
                    from={zone.r / 22}
                    to={zone.r / 18}
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.7"
                    to="0"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              ) : null}
              <circle cx={zone.x} cy={zone.y} r="0.25" fill={stroke} />
              <text
                x={zone.x + zone.r / 22 + 0.5}
                y={zone.y - 0.6}
                fill={stroke}
                fontSize="1.2"
                fontFamily="JetBrains Mono, monospace"
                letterSpacing="0.05em"
              >
                {zone.name}
              </text>
              <text
                x={zone.x + zone.r / 22 + 0.5}
                y={zone.y + 0.8}
                fill="color-mix(in oklch, var(--foreground) 50%, transparent)"
                fontSize="0.9"
                fontFamily="JetBrains Mono, monospace"
              >
                R={zone.radius_m}M / N={zone.members}
              </text>
            </g>
          );
        })}

        {userPins.map((pin) => {
          const profile = profiles.find((profileItem) => profileItem.id === pin.id);

          if (profile === undefined) {
            return null;
          }

          return (
            <g key={pin.id}>
              <circle cx={pin.x} cy={pin.y} r="0.9" fill={pin.color}>
                <animate attributeName="r" values="0.9;1.4;0.9" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.4;1" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <circle cx={pin.x} cy={pin.y} r="0.5" fill={pin.color} stroke="var(--background)" strokeWidth="0.12" />
              <text
                x={pin.x + 1.2}
                y={pin.y + 0.4}
                fill={pin.color}
                fontSize="1"
                fontFamily="JetBrains Mono, monospace"
                letterSpacing="0.05em"
              >
                {profile.initials}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="absolute top-3 left-3 font-mono text-[10px] tracking-widest text-foreground/60 uppercase space-y-0.5">
        <div>
          <span className="text-primary">|</span> LAT 40°25′N · LNG 03°42′W
        </div>
        <div>
          <span className="text-primary">|</span> ZOOM 14 · GRID 32M
        </div>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-2">
        <span
          className="size-1.5 rounded-full bg-primary blink"
          style={{ boxShadow: '0 0 8px var(--primary)' }}
        />
        <span className="font-mono text-[10px] tracking-widest text-primary uppercase">MOCK / PREVIEW</span>
      </div>

      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-4">
        <div className="font-mono text-[10px] text-foreground/40 uppercase tracking-widest">
          mock telemetry · ch: location_events preview
        </div>
        <div className="flex gap-2">
          <Button disabled size="sm" variant="outline" className="font-mono text-[10px] tracking-widest uppercase">
            + MOCK ZONE
          </Button>
          <Button disabled size="sm" variant="ghost" className="font-mono text-[10px] tracking-widest uppercase">
            RECENTER PREVIEW
          </Button>
        </div>
      </div>

      <Brackets size={5} />
    </div>
  );
}
