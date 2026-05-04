'use client';

import * as React from 'react';
import { DataCard } from '@/components/ui/DataCard';

type TimeRange = '1H' | '6H' | '24H' | '7D';

const TIME_RANGES: TimeRange[] = ['1H', '6H', '24H', '7D'];

const SEED_DATA = [
  4, 7, 5, 9, 12, 8, 14, 11, 16, 13, 18, 15, 21, 17, 24, 19, 16, 22, 18, 14, 11, 9, 12, 15,
];

export function ActivityChart(): JSX.Element {
  const [range, setRange] = React.useState<TimeRange>('24H');

  const points = React.useMemo(() => {
    const max = Math.max(...SEED_DATA);
    return SEED_DATA.map((v, i) => ({
      x: (i / (SEED_DATA.length - 1)) * 100,
      y: 100 - (v / max) * 85 - 5,
    }));
  }, []);

  const pathD = 'M ' + points.map((p) => `${p.x},${p.y}`).join(' L ');
  const areaD = pathD + ' L 100,100 L 0,100 Z';

  return (
    <DataCard
      title="LOCATION EVENTS / MOCK 24H"
      subtitle="DETECTOR PREVIEW"
      headerRight={
        <span className="font-mono text-[10px] tracking-widest text-foreground/40">UTC -06</span>
      }
    >
      <div className="px-4 pt-4 pb-3 space-y-2">
        <div className="flex items-end gap-6">
          <div>
            <div className="text-[10px] tracking-widest text-foreground/60 uppercase">
              events triggered
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-primary font-mono">|</span>
              <span className="font-mono text-3xl">418</span>
              <span className="font-mono text-xs text-accent">▲ 12.4%</span>
            </div>
          </div>
          <div className="flex-1" />
          <div className="flex gap-1">
            {TIME_RANGES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setRange(t)}
                className={`px-2 h-7 rounded font-mono text-[10px] tracking-widest ${
                  range === t
                    ? 'bg-primary/15 text-primary border-thin border-primary/50'
                    : 'text-foreground/40 hover:text-primary'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="relative h-[150px] mt-2">
          <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[20, 40, 60, 80].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="color-mix(in oklch, var(--primary) 8%, transparent)"
                strokeWidth="0.2"
              />
            ))}
            <path d={areaD} fill="url(#chart-grad)" />
            <path d={pathD} fill="none" stroke="var(--primary)" strokeWidth="0.6" />
            <path
              d={pathD}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="0.4"
              className="pulse-trace"
              opacity="0.7"
            />
            {points.map((p, i) =>
              i % 3 === 0 ? (
                <circle key={i} cx={p.x} cy={p.y} r="0.5" fill="var(--primary)" />
              ) : null,
            )}
          </svg>
        </div>

        <div className="flex justify-between font-mono text-[10px] text-foreground/40 tracking-widest">
          {['00:00', '06:00', '12:00', '18:00', 'NOW'].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
    </DataCard>
  );
}
