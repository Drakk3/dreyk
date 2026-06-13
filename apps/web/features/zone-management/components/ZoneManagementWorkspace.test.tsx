import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ZoneManagementSnapshot } from '../types';

import { ZoneManagementWorkspace } from './ZoneManagementWorkspace';

interface RealtimeBridgeMockProps {
  config: { scope: string };
}

const bridgeMocks = vi.hoisted(() => ({
  render: vi.fn<(scope: string) => void>(),
}));

vi.mock('../hooks/useZoneManagement', () => ({
  useZoneManagement: () => ({
    deleteCandidate: null,
    draft: {
      groupId: '',
      isActive: true,
      latitude: '',
      longitude: '',
      name: '',
      radiusMeters: '',
    },
    handleConfirmDelete: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    handleDeleteRequest: vi.fn<() => void>(),
    handleDismissDelete: vi.fn<() => void>(),
    handleDraftChange: vi.fn<(field: string, value: boolean | string) => void>(),
    handleSaveZone: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    handleSelectZone: vi.fn<(selectedZoneId: string | null) => void>(),
    handleStartCreate: vi.fn<() => void>(),
    handleToggleZoneActive: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    isMutating: false,
    mode: 'create',
    mutationMessage: null,
    selectedZone: null,
    selectedZoneId: null,
    validationErrors: {},
  }),
}));

vi.mock('@/shared/realtime/RealtimeSnapshotRefreshBridge', () => ({
  RealtimeSnapshotRefreshBridge: ({ config }: RealtimeBridgeMockProps) => {
    bridgeMocks.render(config.scope);
    return <div data-testid="realtime-bridge">{config.scope}</div>;
  },
}));

vi.mock('@/shared/geofencing/GeofencingMapCanvas', () => ({
  GeofencingMapCanvas: () => <div>Zone map</div>,
}));

vi.mock('@/shared/geofencing/ZoneDetailsPanel', () => ({
  ZoneDetailsPanel: () => <div>Zone details</div>,
}));

vi.mock('./ZoneManagementList', () => ({
  ZoneManagementList: () => <div>Zone list</div>,
}));

vi.mock('./ZoneManagementForm', () => ({
  ZoneManagementForm: () => <div>Zone form</div>,
}));

vi.mock('./ZoneVoiceConfigurationPanel', () => ({
  ZoneVoiceConfigurationPanel: () => <div>Voice config</div>,
}));

vi.mock('./ZoneDeleteConfirmation', () => ({
  ZoneDeleteConfirmation: () => <div>Delete confirmation</div>,
}));

function createSnapshot(): ZoneManagementSnapshot {
  return {
    fetchedAt: '2026-05-31T21:40:00.000Z',
    groupOptions: [{ id: 'group-1', name: 'Alpha' }],
    selectedZoneId: null,
    zones: [],
  };
}

describe('ZoneManagementWorkspace', () => {
  beforeEach(() => {
    bridgeMocks.render.mockReset();
  });

  it('mounts the realtime snapshot refresh bridge once for admin-zones scope', () => {
    render(
      <ZoneManagementWorkspace
        adminDisplayName="Dreyk Admin"
        adminUserId="admin-1"
        snapshot={createSnapshot()}
      />,
    );

    expect(screen.getAllByTestId('realtime-bridge')).toHaveLength(1);
    expect(screen.getByTestId('realtime-bridge')).toHaveTextContent('admin-zones');
    expect(bridgeMocks.render).toHaveBeenLastCalledWith('admin-zones');
  });
});
