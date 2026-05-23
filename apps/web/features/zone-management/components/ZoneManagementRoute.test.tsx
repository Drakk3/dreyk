import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AdminZonesPage from '@/app/(admin)/admin/zones/page';
import { getZoneManagementSnapshot } from '@/features/zone-management/services/zoneManagementQuery';

const authMocks = vi.hoisted(() => ({
  requireAdminUser: vi.fn(),
}));

vi.mock('@/lib/auth/authContext', () => ({
  requireAdminUser: authMocks.requireAdminUser,
}));

vi.mock('@/features/zone-management/services/zoneManagementQuery', () => ({
  getZoneManagementSnapshot: vi.fn(),
}));

vi.mock('@/features/zone-management/components/ZoneManagementWorkspace', () => ({
  ZoneManagementWorkspace: ({ adminDisplayName }: { adminDisplayName: string }) => <div>Zone workspace for {adminDisplayName}</div>,
}));

describe('AdminZonesPage', () => {
  beforeEach(() => {
    authMocks.requireAdminUser.mockReset();
    vi.mocked(getZoneManagementSnapshot).mockReset();
  });

  it('loads the admin-only zone workspace', async () => {
    authMocks.requireAdminUser.mockResolvedValue({
      profile: {
        avatar_url: null,
        created_at: '2026-05-18T08:00:00.000Z',
        display_name: 'Dreyk Admin',
        id: '11111111-1111-4111-8111-111111111111',
        is_active: true,
        role: 'admin',
        theme_preference: 'ares',
      },
      role: 'admin',
      userId: '11111111-1111-4111-8111-111111111111',
    });
    vi.mocked(getZoneManagementSnapshot).mockResolvedValue({
      fetchedAt: '2026-05-18T10:00:00.000Z',
      groupOptions: [],
      selectedZoneId: null,
      zones: [],
    });

    const page = await AdminZonesPage();
    render(page);

    expect(screen.getByText('Zone workspace for Dreyk Admin')).toBeInTheDocument();
    expect(getZoneManagementSnapshot).toHaveBeenCalledTimes(1);
  });

  it('keeps the route admin-gated', async () => {
    authMocks.requireAdminUser.mockRejectedValue(new Error('redirect:/'));

    await expect(AdminZonesPage()).rejects.toThrow('redirect:/');
    expect(getZoneManagementSnapshot).not.toHaveBeenCalled();
  });
});
