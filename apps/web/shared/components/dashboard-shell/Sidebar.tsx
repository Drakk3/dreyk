'use client';

import * as React from 'react';
import { useAuthSignOut } from '@/shared/hooks/useAuthSignOut';

const NAV_PRIMARY = [
  { key: 'ops', label: 'OPERATIONS', icon: '◊' },
  { key: 'zones', label: 'ZONES', icon: '▢' },
  { key: 'members', label: 'MEMBERS', icon: '◉' },
  { key: 'events', label: 'EVENTS', icon: '≣' },
  { key: 'alexa', label: 'ALEXA', icon: '▲' },
  { key: 'modules', label: 'MODULES', icon: '▣' },
];

const NAV_SYSTEM = [
  { key: 'settings', label: 'SETTINGS', icon: '✦' },
  { key: 'logs', label: 'AUDIT LOG', icon: '≡' },
];

interface SidebarProps {
  active: string;
  onNav: (key: string) => void;
  displayName: string;
  role: string;
  initials: string;
}

export function Sidebar({ active, onNav, displayName, role, initials }: SidebarProps): JSX.Element {
  const { handleSignOut, isSigningOut } = useAuthSignOut();

  return (
    <aside className="hidden lg:flex w-[220px] shrink-0 flex-col border-r border-border bg-card/40">
      <div className="px-5 py-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="relative size-7 rounded border-thin border-primary/60 flex items-center justify-center bg-primary/10 glow-sm">
            <span className="font-mono text-primary text-xs font-bold">D</span>
            <span className="absolute inset-0 rounded border border-primary/30 blink" />
          </div>
          <div>
            <div className="font-mono text-sm tracking-[0.22em] uppercase">DREYK</div>
            <div className="font-mono text-[9px] tracking-widest text-foreground/40 uppercase">
              PHASE 3 / ARES
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <div className="px-4 pb-1.5 font-mono text-[9px] tracking-widest text-foreground/30 uppercase">
          PRIMARY
        </div>
        {NAV_PRIMARY.map((n) => (
          <button
            key={n.key}
            type="button"
            onClick={() => onNav(n.key)}
            className={`relative w-full grid grid-cols-[18px_1fr_auto] items-center gap-3 px-4 h-9 text-left font-mono text-xs tracking-widest uppercase transition-colors ${
              active === n.key
                ? 'text-primary bg-primary/10'
                : 'text-foreground/60 hover:text-primary hover:bg-primary/5'
            }`}
          >
            {active === n.key && (
              <span
                className="absolute left-0 top-1.5 bottom-1.5 w-px bg-primary"
                style={{ boxShadow: '0 0 8px var(--primary)' }}
              />
            )}
            <span
              className={`text-center ${active === n.key ? 'text-primary' : 'text-foreground/40'}`}
            >
              {n.icon}
            </span>
            <span className="truncate">{n.label}</span>
            {n.key === 'events' && (
              <span className="font-mono text-[9px] px-1.5 rounded border-thin border-destructive/50 bg-destructive/20 text-foreground">
                3
              </span>
            )}
          </button>
        ))}

        <div className="mt-4 px-4 pb-1.5 font-mono text-[9px] tracking-widest text-foreground/30 uppercase">
          SYSTEM
        </div>
        {NAV_SYSTEM.map((n) => (
          <button
            key={n.key}
            type="button"
            disabled
            className="w-full grid grid-cols-[18px_1fr] items-center gap-3 px-4 h-9 text-left font-mono text-xs tracking-widest uppercase text-foreground/30"
          >
            <span className="text-foreground/40">{n.icon}</span>
            <span>{n.label} / PREVIEW</span>
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-border/50 space-y-2">
        <div className="flex items-center gap-2 px-2">
          <div className="size-7 rounded-full border-thin border-primary/40 flex items-center justify-center font-mono text-[10px] text-primary bg-primary/10 shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[11px] tracking-widest uppercase truncate">
              {displayName}
            </div>
            <div className="font-mono text-[9px] tracking-widest text-foreground/40 uppercase">
              {role.toUpperCase()} · ARES
            </div>
          </div>
          <span
            className="size-1.5 rounded-full bg-primary shrink-0"
            style={{ boxShadow: '0 0 6px var(--primary)' }}
          />
        </div>
        <button
          type="button"
          disabled={isSigningOut}
          onClick={() => {
            void handleSignOut();
          }}
          className="w-full flex items-center justify-between gap-2 px-3 h-9 rounded border-thin border-destructive/30 bg-background/60 hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
        >
          <span className="font-mono text-[10px] tracking-widest text-foreground/40 uppercase group-hover:text-destructive">
            {isSigningOut ? 'SIGNING OUT…' : '⏻ SIGN OUT'}
          </span>
        </button>
      </div>
    </aside>
  );
}
