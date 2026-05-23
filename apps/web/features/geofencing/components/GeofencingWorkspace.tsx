'use client';

import { Select } from '@/components/thegridcn/select';
import * as React from 'react';

import type { Profile } from '@dreyk/shared/types/domain';
import type { Role } from '@dreyk/shared/types/database';

import { CommandMenu } from '@/components/thegridcn/command-menu';
import { DataCard } from '@/components/thegridcn/data-card';
import { useGlobalCommandMenu } from '@/shared/command-center/useGlobalCommandMenu';
import type { SharedCommandMenuItem } from '@/shared/command-center/types';
import { AppSidebar } from '@/shared/components/app-shell/AppSidebar';
import { AppTopbar } from '@/shared/components/app-shell/AppTopbar';
import { GeofencingMapCanvas } from '@/shared/geofencing/GeofencingMapCanvas';
import { ZoneDetailsPanel } from '@/shared/geofencing/ZoneDetailsPanel';

import { useGeofencingWorkspace } from '../hooks/useGeofencingWorkspace';
import { GEOFENCING_COMMANDS, GEOFENCING_NAV_SECTIONS } from '../navigation';
import type { GeofencingPanelFocus, GeofencingWorkspaceSnapshot } from '../types';
import { EventsPanel } from './EventsPanel';

interface GeofencingWorkspaceProps {
  profile: Profile;
  role: Role;
  snapshot: GeofencingWorkspaceSnapshot;
}

function getInitials(displayName: string): string {
  return displayName
    .split(/[\s._-]+/)
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function isGeofencingPanelFocus(value: string): value is GeofencingPanelFocus {
  return ['workspace', 'zones', 'events', 'coverage', 'snapshot', 'access'].includes(value);
}

export function GeofencingWorkspace({ profile, role, snapshot }: GeofencingWorkspaceProps): JSX.Element {
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = React.useState<boolean>(true);
  const {
    appliedFilters,
    filterStatusCopy,
    filterOptions,
    handlePanelFocusChange,
    handleSetEventTypeFilter,
    handleSetGroupFilter,
    handleSelectZone,
    handleSetUserFilter,
    isAdminFilterable,
    panelFocus,
    recentEvents,
    selectedZone,
    selectedZoneId,
    statusLabel,
    summary,
  } = useGeofencingWorkspace(snapshot);

  const initials = getInitials(profile.display_name);

  const localCommandItems = React.useMemo<SharedCommandMenuItem[]>(() => {
    return GEOFENCING_COMMANDS.map((command) => ({
      description: `Focus the ${command.label.toLowerCase()} surface inside geofencing.`,
      group: 'NAVIGATE',
      label: command.label,
      onSelect: () => {
        if (isGeofencingPanelFocus(command.key)) {
          handlePanelFocusChange(command.key);
        }
      },
      shortcut: command.shortcut,
    }));
  }, [handlePanelFocusChange]);

  const {
    commandItems,
    handleCommandMenuChange,
    handleCommandMenuOpen,
    isCommandMenuOpen,
  } = useGlobalCommandMenu({ currentSurface: 'geofencing', localItems: localCommandItems, role });

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 circuit-bg" />
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(circle at 80% -10%, color-mix(in oklch, var(--primary) 10%, transparent), transparent 50%), radial-gradient(circle at -10% 110%, color-mix(in oklch, var(--accent) 8%, transparent), transparent 50%)',
        }}
      />

      <AppSidebar
        activeItemKey={panelFocus}
        brandName="DREYK"
        brandTagline="GEOFENCING / READ ONLY"
        isDesktopOpen={isDesktopSidebarOpen}
        navSections={GEOFENCING_NAV_SECTIONS}
        onItemSelect={(key: string) => {
          if (isGeofencingPanelFocus(key)) {
            handlePanelFocusChange(key);
          }
        }}
        userDisplayName={profile.display_name}
        userInitials={initials}
        userRoleLabel={`${role.toUpperCase()} · GEOFENCING`}
      />

      <div className="relative flex min-h-screen min-w-0 flex-1 flex-col">
        <AppTopbar
          breadcrumbs={['PWA / WEB', 'OPERATIONS', 'GEOFENCING WORKSPACE']}
          highlightedBreadcrumbIndex={2}
          initials={initials}
          onCommandOpen={handleCommandMenuOpen}
          onDesktopSidebarToggle={() => setIsDesktopSidebarOpen((currentValue) => !currentValue)}
          statusLabel={statusLabel}
          isDesktopSidebarOpen={isDesktopSidebarOpen}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="space-y-5 px-6 py-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
                  Session · {profile.display_name.toUpperCase()} / {role.toUpperCase()} · geofencing
                </div>
                <h1 className="mt-1 flex items-center gap-3 text-2xl uppercase tracking-[0.22em]">
                  <span className="font-mono text-3xl text-primary">|</span>
                  GEOFENCING / WORKSPACE
                </h1>
                <p className="mt-1 text-sm uppercase tracking-[0.12em] text-muted-foreground">
                  Authenticated read model for persisted zones and recent location events.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <DataCard
                  className="min-w-[150px]"
                  fields={[
                    { label: 'Zones', value: `${summary.totalZonesCount}` },
                    { label: 'Active', value: `${summary.activeZonesCount}` },
                  ]}
                />
                <DataCard className="min-w-[150px]" fields={[{ label: 'Events', value: `${summary.totalEventsCount}` }]} />
                <DataCard
                  className="min-w-[220px]"
                  fields={[
                    { label: 'Fetched at', value: new Date(snapshot.fetchedAt).toLocaleString() },
                  ]}
                />
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
              <GeofencingMapCanvas
                events={recentEvents}
                onSelectZone={handleSelectZone}
                selectedZoneId={selectedZoneId}
                zones={snapshot.zones}
              />
              <ZoneDetailsPanel selectedZone={selectedZone} />
            </div>

            {isAdminFilterable ? (
              <DataCard title="Admin filters" subtitle="URL-backed server snapshot controls">
                <div className="grid gap-4 p-4 md:grid-cols-3">
                  <Select
                    label="Group"
                    onChange={(value: string) => {
                      handleSetGroupFilter(value.length > 0 ? value : null);
                    }}
                    options={[
                      { label: 'All groups', value: '' },
                      ...filterOptions.groups.map((group) => ({ label: group.name, value: group.id })),
                    ]}
                    value={appliedFilters.groupId ?? ''}
                  />
                  <Select
                    disabled={appliedFilters.groupId === null || filterOptions.users.length === 0}
                    label="User"
                    onChange={(value: string) => {
                      handleSetUserFilter(value.length > 0 ? value : null);
                    }}
                    options={[
                      { label: 'All users', value: '' },
                      ...filterOptions.users.map((user) => ({ label: user.displayName, value: user.id })),
                    ]}
                    placeholder={appliedFilters.groupId === null ? 'Select a group first' : 'All users'}
                    value={appliedFilters.userId ?? ''}
                  />
                  <Select
                    label="Event"
                    onChange={(value: string) => {
                      if (value === 'all' || value === 'enter' || value === 'exit') {
                        handleSetEventTypeFilter(value);
                      }
                    }}
                    options={[
                      { label: 'All events', value: 'all' },
                      { label: 'Enter only', value: 'enter' },
                      { label: 'Exit only', value: 'exit' },
                    ]}
                    value={appliedFilters.eventType}
                  />
                </div>
                <div className="border-t border-border/30 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/45">
                  {filterStatusCopy}
                </div>
              </DataCard>
            ) : null}

            <EventsPanel
              appliedFilters={appliedFilters}
              events={recentEvents}
              viewerScope={snapshot.viewerScope}
            />

            <footer className="flex items-center justify-between gap-4 pb-4 pt-2 font-mono text-[10px] uppercase tracking-widest text-foreground/30">
              <span>DREYK / GEOFENCING READ MODEL</span>
              <span>{snapshot.viewerScope === 'admin-global' ? 'ADMIN GLOBAL VISIBILITY' : 'USER SELF EVENTS + GROUP ZONES'}</span>
            </footer>
          </div>
        </main>
      </div>

      <CommandMenu
        items={commandItems}
        label="DREYK / GEOFENCING COMMAND"
        onOpenChange={handleCommandMenuChange}
        open={isCommandMenuOpen}
        placeholder="Search geofencing surfaces or global workspaces…"
      />
    </div>
  );
}
