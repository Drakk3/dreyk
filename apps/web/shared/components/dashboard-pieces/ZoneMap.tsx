'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Brackets } from '@/shared/components/primitives/Brackets';
import type { DashboardZone, DashboardUserPin, DashboardProfile } from '@/shared/types/dashboard';

interface ZoneMapProps {
  zones: DashboardZone[];
  userPins: DashboardUserPin[];
  profiles: DashboardProfile[];
  selectedZone: string;
  onSelect: (id: string) => void;
}

export function ZoneMap({
  zones,
  userPins,
  profiles,
  selectedZone,
  onSelect,
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

      <svg
        viewBox="0 0 100 60"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
      >
        {userPins
          .filter((p) => p.zone !== null)
          .map((p) => {
            const z = zones.find((zz) => zz.id === p.zone);
            if (z === undefined) return null;
            return (
              <line
                key={p.id}
                x1={p.x}
                y1={p.y}
                x2={z.x}
                y2={z.y}
                stroke="color-mix(in oklch, var(--primary) 30%, transparent)"
                strokeWidth="0.15"
                strokeDasharray="0.6 0.4"
              />
            );
          })}

        {zones.map((z) => {
          const sel = selectedZone === z.id;
          const stroke = !z.active
            ? 'var(--muted-foreground)'
            : sel
              ? 'var(--accent)'
              : 'var(--primary)';
          const opacity = !z.active ? 0.35 : sel ? 1 : 0.7;
          return (
            <g
              key={z.id}
              onClick={() => onSelect(z.id)}
              style={{ cursor: 'pointer' }}
              opacity={opacity}
            >
              <circle
                cx={z.x}
                cy={z.y}
                r={z.r / 22}
                fill={stroke}
                fillOpacity={sel ? 0.12 : 0.06}
                stroke={stroke}
                strokeWidth={sel ? '0.35' : '0.18'}
              />
              {sel && (
                <circle
                  cx={z.x}
                  cy={z.y}
                  r={z.r / 22}
                  fill="none"
                  stroke={stroke}
                  strokeWidth="0.15"
                  strokeDasharray="0.4 0.3"
                >
                  <animate
                    attributeName="r"
                    from={z.r / 22}
                    to={z.r / 18}
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
              )}
              <circle cx={z.x} cy={z.y} r="0.25" fill={stroke} />
              <text
                x={z.x + z.r / 22 + 0.5}
                y={z.y - 0.6}
                fill={stroke}
                fontSize="1.2"
                fontFamily="JetBrains Mono, monospace"
                letterSpacing="0.05em"
              >
                {z.name}
              </text>
              <text
                x={z.x + z.r / 22 + 0.5}
                y={z.y + 0.8}
                fill="color-mix(in oklch, var(--foreground) 50%, transparent)"
                fontSize="0.9"
                fontFamily="JetBrains Mono, monospace"
              >
                R={z.radius_m}M / N={z.members}
              </text>
            </g>
          );
        })}

        {userPins.map((p) => {
          const profile = profiles.find((pp) => pp.id === p.id);
          if (profile === undefined) return null;
          return (
            <g key={p.id}>
              <circle cx={p.x} cy={p.y} r="0.9" fill={p.color}>
                <animate
                  attributeName="r"
                  values="0.9;1.4;0.9"
                  dur="2.4s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="1;0.4;1"
                  dur="2.4s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle
                cx={p.x}
                cy={p.y}
                r="0.5"
                fill={p.color}
                stroke="var(--background)"
                strokeWidth="0.12"
              />
              <text
                x={p.x + 1.2}
                y={p.y + 0.4}
                fill={p.color}
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
        <span className="font-mono text-[10px] tracking-widest text-primary uppercase">
          MOCK / PREVIEW
        </span>
      </div>

      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-4">
        <div className="font-mono text-[10px] text-foreground/40 uppercase tracking-widest">
          mock telemetry · ch: location_events preview
        </div>
        <div className="flex gap-2">
          <Button
            disabled
            size="sm"
            variant="outline"
            className="font-mono text-[10px] tracking-widest uppercase"
          >
            + MOCK ZONE
          </Button>
          <Button
            disabled
            size="sm"
            variant="ghost"
            className="font-mono text-[10px] tracking-widest uppercase"
          >
            RECENTER PREVIEW
          </Button>
        </div>
      </div>

      <Brackets size={5} />
    </div>
  );
}
