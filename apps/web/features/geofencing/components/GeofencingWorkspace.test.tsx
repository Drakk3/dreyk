import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Profile } from '@dreyk/shared/types/domain';

import { GeofencingWorkspace } from './GeofencingWorkspace';
import type { GeofencingWorkspaceSnapshot } from '../types';

interface SelectMockOption {
  label: string;
  value: string;
}

interface SelectMockProps {
  disabled?: boolean;
  label?: string;
  onChange?: (value: string) => void;
  options: SelectMockOption[];
  placeholder?: string;
  value?: string;
}

interface MapCanvasMockProps {
  zones: Array<{ name: string }>;
}

interface RealtimeBridgeMockProps {
  config: { scope: string };
}

const bridgeMocks = vi.hoisted(() => ({
  render: vi.fn<(scope: string) => void>(),
}));

vi.mock('@/shared/hooks/useAuthSignOut', () => ({
  useAuthSignOut: () => ({
    handleSignOut: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    isSigningOut: false,
  }),
}));

vi.mock('@/shared/command-center/useGlobalCommandMenu', () => ({
  useGlobalCommandMenu: () => ({
    commandItems: [],
    handleCommandMenuChange: vi.fn<(open: boolean) => void>(),
    handleCommandMenuOpen: vi.fn<() => void>(),
    handleCommandNavigation: vi.fn<(href: string) => void>(),
    handleCommandMenuToggle: vi.fn<() => void>(),
    isCommandMenuOpen: false,
  }),
}));

const navigationMocks = vi.hoisted(() => ({
  replace: vi.fn<(href: string) => void>(),
  searchParams: new URLSearchParams('group=group-1&event=all'),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/geofencing',
  useRouter: () => ({ replace: navigationMocks.replace }),
  useSearchParams: () => navigationMocks.searchParams,
}));

vi.mock('@/components/thegridcn/select', () => ({
  Select: ({
    disabled = false,
    label,
    onChange,
    options,
    placeholder,
    value = '',
  }: SelectMockProps) => (
    <label>
      <span>{label}</span>
      <select
        aria-label={label}
        disabled={disabled}
        onChange={(event) => onChange?.(event.currentTarget.value)}
        value={value}
      >
        <option value="">{placeholder ?? 'Select'}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
}));

vi.mock('@/shared/geofencing/GeofencingMapCanvas', () => ({
  GeofencingMapCanvas: ({ zones }: MapCanvasMockProps) => <div>Map canvas · {zones.length} zones</div>,
}));

vi.mock('@/shared/realtime/RealtimeSnapshotRefreshBridge', () => ({
  RealtimeSnapshotRefreshBridge: ({ config }: RealtimeBridgeMockProps) => {
    bridgeMocks.render(config.scope);
    return <div data-testid="realtime-bridge">{config.scope}</div>;
  },
}));

function createProfile(): Profile {
  return {
    avatar_url: null,
    created_at: '2026-05-17T10:00:00.000Z',
    display_name: 'Dreyk Ops',
    id: 'user-1',
    is_active: true,
    role: 'admin',
    theme_preference: 'ares',
  };
}

function createSnapshot(role: 'admin' | 'user'): GeofencingWorkspaceSnapshot {
  return {
    appliedFilters: {
      eventType: 'all' as const,
      groupId: role === 'admin' ? 'group-1' : null,
      isAdminFilterable: role === 'admin',
      userId: null,
    },
    filterOptions: {
      groups: [{ id: 'group-1', name: 'Alpha' }],
      users: [{ displayName: 'Ana Ops', groupId: 'group-1', id: 'user-1' }],
    },
    fetchedAt: '2026-05-17T12:00:00.000Z',
    recentEvents: [
      {
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
      },
    ],
    selectedZoneId: 'zone-1',
    viewerScope: role === 'admin' ? ('admin-global' as const) : ('user-self-plus-group-zones' as const),
    zones: [
      {
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
      },
    ],
  };
}

describe('GeofencingWorkspace', () => {
  beforeEach(() => {
    bridgeMocks.render.mockReset();
  });

  it('mounts the realtime snapshot refresh bridge once for geofencing scope', () => {
    render(<GeofencingWorkspace profile={createProfile()} role="admin" snapshot={createSnapshot('admin')} />);

    expect(screen.getAllByTestId('realtime-bridge')).toHaveLength(1);
    expect(screen.getByTestId('realtime-bridge')).toHaveTextContent('geofencing');
    expect(bridgeMocks.render).toHaveBeenLastCalledWith('geofencing');
  });

  it('renders the read-only snapshot without preview copy or disabled CRUD affordances', () => {
    render(
        <GeofencingWorkspace
          profile={createProfile()}
          role="admin"
          snapshot={createSnapshot('admin')}
        />, 
    );

    expect(screen.getByText('GEOFENCING / WORKSPACE')).toBeInTheDocument();
    expect(screen.getByText('Map canvas · 1 zones')).toBeInTheDocument();
    expect(screen.getAllByText('Ana Ops').length).toBeGreaterThan(0);
    expect(screen.queryByText(/preview/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/mock/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /create/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.getByText('Admin filters')).toBeInTheDocument();
  });

  it('renders operational empty states when the snapshot has no records', () => {
    render(
        <GeofencingWorkspace
          profile={createProfile()}
          role="user"
          snapshot={{
            appliedFilters: {
              eventType: 'all',
              groupId: null,
              isAdminFilterable: false,
              userId: null,
            },
            filterOptions: {
              groups: [],
              users: [],
            },
            fetchedAt: '2026-05-17T12:00:00.000Z',
            recentEvents: [],
            selectedZoneId: null,
          viewerScope: 'user-self-plus-group-zones',
          zones: [],
        }}
      />,
    );

    expect(screen.getByText('No zone selected')).toBeInTheDocument();
    expect(screen.getByText('Empty event stream')).toBeInTheDocument();
    expect(screen.getByText(/no personal persisted location events/i)).toBeInTheDocument();
    expect(screen.queryByText('Admin filters')).not.toBeInTheDocument();
  });

  it('updates the URL when admin filters change', () => {
    render(<GeofencingWorkspace profile={createProfile()} role="admin" snapshot={createSnapshot('admin')} />);

    fireEvent.change(screen.getByLabelText('Event'), { target: { value: 'exit' } });

    expect(navigationMocks.replace).toHaveBeenCalledWith('/geofencing?group=group-1&event=exit', { scroll: false });
  });
});
