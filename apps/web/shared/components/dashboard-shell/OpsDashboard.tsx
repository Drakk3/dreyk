'use client';

import * as React from 'react';
import type { Profile } from '@dreyk/shared/types/domain';
import type { Role } from '@dreyk/shared/types/database';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandMenu } from '@/components/thegridcn/command-menu';
import { Button } from '@/components/ui/button';
import { DataCard } from '@/components/thegridcn/data-card';
import { KpiStrip } from '@/shared/components/dashboard-pieces/KpiStrip';
import { ZoneMap } from '@/shared/components/dashboard-pieces/ZoneMap';
import { ZoneRoster } from '@/shared/components/dashboard-pieces/ZoneRoster';
import { ActivityChart } from '@/shared/components/dashboard-pieces/ActivityChart';
import { MembersPanel } from '@/shared/components/dashboard-pieces/MembersPanel';
import { ModuleStatus } from '@/shared/components/dashboard-pieces/ModuleStatus';
import { EventsTable } from '@/shared/components/dashboard-pieces/EventsTable';
import { NetworkStatusCard } from '@/shared/components/dashboard-pieces/NetworkStatusCard';
import { EventTicker } from '@/shared/components/dashboard-pieces/EventTicker';
import { useAuthSignOut } from '@/shared/hooks/useAuthSignOut';

import {
  MOCK_ZONES,
  MOCK_USER_PINS,
  MOCK_PROFILES,
  MOCK_EVENTS,
} from '@/shared/data/dashboardMockData';

interface OpsDashboardProps {
  profile: Profile;
  role: Role;
}

function getInitials(displayName: string): string {
  return displayName
    .split(/[\s._-]+/)
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

interface CommandItem {
  group: string;
  label: string;
  shortcut?: string;
  onSelect: () => void;
}

interface NavCommand {
  key: string;
  label: string;
  shortcut: string;
}

const NAV_COMMANDS: NavCommand[] = [
  { key: 'ops', label: 'Open Operations', shortcut: 'G O' },
  { key: 'zones', label: 'Open Zones', shortcut: 'G Z' },
  { key: 'members', label: 'Open Members', shortcut: 'G M' },
  { key: 'events', label: 'Open Events', shortcut: 'G E' },
];

export function OpsDashboard({ profile, role }: OpsDashboardProps): JSX.Element {
  const { handleSignOut } = useAuthSignOut();
  const [activeNav, setActiveNav] = React.useState('ops');
  const [selectedZone, setSelectedZone] = React.useState('z-01');
  const [cmdOpen, setCmdOpen] = React.useState(false);

  const initials = getInitials(profile.display_name);

  const cmdItems: CommandItem[] = [
    ...NAV_COMMANDS.map((item) => ({
      group: 'NAVIGATE',
      label: item.label,
      shortcut: item.shortcut,
      onSelect: () => setActiveNav(item.key),
    })),
    {
      group: 'ACTIONS',
      label: 'Sign out',
      shortcut: '⌘ ⇧ Q',
      onSelect: () => void handleSignOut(),
    },
  ];

  const selectedZoneData = MOCK_ZONES.find((z) => z.id === selectedZone);

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 circuit-bg" />
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(circle at 80% -10%, color-mix(in oklch, var(--primary) 10%, transparent), transparent 50%), radial-gradient(circle at -10% 110%, color-mix(in oklch, var(--accent) 8%, transparent), transparent 50%)',
        }}
      />

      <Sidebar
        active={activeNav}
        onNav={setActiveNav}
        displayName={profile.display_name}
        role={role}
        initials={initials}
      />

      <div className="relative flex-1 min-w-0 flex flex-col min-h-screen">
        <Topbar onCmdK={() => setCmdOpen(true)} initials={initials} />

        <main className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="font-mono text-[10px] tracking-widest text-foreground/40 uppercase">
                  SESSION · {profile.display_name.toUpperCase()} / {role.toUpperCase()} · GROUP-α
                </div>
                <h1 className="text-2xl tracking-[0.22em] uppercase mt-1 flex items-center gap-3">
                  <span className="text-primary font-mono text-3xl">|</span>
                  GEOFENCING / OPERATIONS
                </h1>
                <p className="text-sm text-muted-foreground tracking-[0.12em] uppercase mt-1">
                  Phase 3 access · Mock telemetry preview{' '}
                  <span className="text-foreground/80 font-mono">location_events</span> · not wired
                  to live data
                </p>
              </div>
              {role === 'admin' && (
                <div className="flex items-center gap-2">
                  <Button
                    disabled
                    variant="outline"
                    size="sm"
                    className="font-mono text-[10px] tracking-widest uppercase"
                  >
                    EXPORT MOCK
                  </Button>
                  <Button
                    disabled
                    variant="outline"
                    size="sm"
                    className="font-mono text-[10px] tracking-widest uppercase"
                  >
                    AUDIT PREVIEW
                  </Button>
                  <Button
                    disabled
                    size="sm"
                    className="font-mono text-[10px] tracking-widest uppercase"
                  >
                    + MOCK ZONE
                  </Button>
                </div>
              )}
            </div>

            <KpiStrip />

            <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">
              <DataCard
                title="ZONE MAP / GROUP-α"
                subtitle="MOCK PREVIEW"
                headerRight={
                  <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-foreground/40 uppercase">
                    <span className="size-1 rounded-full bg-primary" />
                    {MOCK_USER_PINS.length} MOCK PINS · {MOCK_ZONES.length} ZONES
                  </div>
                }
              >
                <div className="p-3">
                  <ZoneMap
                    zones={MOCK_ZONES}
                    userPins={MOCK_USER_PINS}
                    profiles={MOCK_PROFILES}
                    selectedZone={selectedZone}
                    onSelect={setSelectedZone}
                  />
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-px bg-border/30 border-thin border-border/30 rounded overflow-hidden">
                    <div className="bg-card px-3 py-2">
                      <div className="text-[10px] tracking-widest text-foreground/50 uppercase">
                        SELECTED
                      </div>
                      <div className="font-mono text-xs text-primary tracking-widest uppercase mt-0.5">
                        <span className="text-primary">| </span>
                        {selectedZoneData?.name}
                      </div>
                    </div>
                    <div className="bg-card px-3 py-2">
                      <div className="text-[10px] tracking-widest text-foreground/50 uppercase">
                        RADIUS
                      </div>
                      <div className="font-mono text-xs mt-0.5">{selectedZoneData?.radius_m}M</div>
                    </div>
                    <div className="bg-card px-3 py-2">
                      <div className="text-[10px] tracking-widest text-foreground/50 uppercase">
                        MEMBERS
                      </div>
                      <div className="font-mono text-xs mt-0.5">
                        {selectedZoneData?.members} INSIDE
                      </div>
                    </div>
                    <div className="bg-card px-3 py-2">
                      <div className="text-[10px] tracking-widest text-foreground/50 uppercase">
                        ALEXA
                      </div>
                      <div className="font-mono text-xs mt-0.5">
                        {selectedZoneData?.alexa === true ? 'LINKED' : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </DataCard>

              <ZoneRoster
                zones={MOCK_ZONES}
                selectedZone={selectedZone}
                onSelect={setSelectedZone}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr_1fr] gap-4">
              <ActivityChart />
              <MembersPanel profiles={MOCK_PROFILES} userPins={MOCK_USER_PINS} zones={MOCK_ZONES} />
              <ModuleStatus />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
              <EventsTable events={MOCK_EVENTS} />
              <NetworkStatusCard />
            </div>

            <EventTicker />

            <footer className="flex items-center justify-between gap-4 pt-2 pb-4 font-mono text-[10px] tracking-widest text-foreground/30 uppercase">
              <span>DREYK / OPS PREVIEW · BUILT ON THEGRIDCN · ARES THEME</span>
              <span>UPDATE POLICY: NO CHANGE WITHOUT @DRAKK3 APPROVAL</span>
            </footer>
          </div>
        </main>
      </div>

      <CommandMenu
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        items={cmdItems}
        label="DREYK / COMMAND"
        placeholder="Type a command…"
      />
    </div>
  );
}
