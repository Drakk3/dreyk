import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import GeofencingPage from '@/app/(user)/geofencing/page';
import { getGeofencingWorkspaceSnapshot } from '@/features/geofencing/geofencingWorkspaceQuery';

vi.mock('@/lib/auth/authContext', () => ({
  requireAuthenticatedAppUser: vi.fn(() => Promise.resolve({
    profile: {
      avatar_url: null,
      created_at: '2026-05-17T10:00:00.000Z',
      display_name: 'Dreyk Ops',
      id: 'user-1',
      is_active: true,
      role: 'admin',
      theme_preference: 'ares',
    },
    role: 'admin',
    userId: 'user-1',
  })),
}));

vi.mock('@/features/geofencing/geofencingWorkspaceQuery', () => ({
  getGeofencingWorkspaceSnapshot: vi.fn(() => Promise.resolve({
    fetchedAt: '2026-05-17T12:00:00.000Z',
    recentEvents: [],
    selectedZoneId: null,
    viewerScope: 'admin-global',
    zones: [],
  })),
}));

vi.mock('@/features/geofencing/components/GeofencingWorkspace', () => ({
  GeofencingWorkspace: ({ profile }: { profile: { display_name: string } }) => (
    <div>Workspace rendered for {profile.display_name}</div>
  ),
}));

describe('GeofencingPage', () => {
  it('renders the authenticated geofencing workspace route', async () => {
    const page = await GeofencingPage({
      searchParams: {
        event: 'enter',
        group: 'group-1',
        user: 'user-2',
      },
    });

    render(page);

    expect(screen.getByText('Workspace rendered for Dreyk Ops')).toBeInTheDocument();
    expect(getGeofencingWorkspaceSnapshot).toHaveBeenCalledWith({
      filters: {
        eventType: 'enter',
        groupId: 'group-1',
        userId: 'user-2',
      },
      role: 'admin',
      userId: 'user-1',
    });
  });

  it('normalizes invalid route params before calling the snapshot query', async () => {
    await GeofencingPage({
      searchParams: {
        event: 'invalid',
        group: ['group-1'],
        user: '',
      },
    });

    expect(getGeofencingWorkspaceSnapshot).toHaveBeenLastCalledWith({
      filters: {
        eventType: 'all',
        groupId: null,
        userId: null,
      },
      role: 'admin',
      userId: 'user-1',
    });
  });
});
