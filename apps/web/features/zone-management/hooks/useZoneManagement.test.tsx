import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ZoneManagementSnapshot } from '../types';

import { useZoneManagement } from './useZoneManagement';

const navigationMocks = vi.hoisted(() => ({
  refresh: vi.fn<() => void>(),
}));

const browserMocks = vi.hoisted(() => {
  const insert = vi.fn<() => Promise<{ error: Error | null }>>();
  const updateEq = vi.fn<() => Promise<{ error: Error | null }>>();
  const update = vi.fn(() => ({ eq: updateEq }));
  const deleteEq = vi.fn<() => Promise<{ error: Error | null }>>();
  const remove = vi.fn(() => ({ eq: deleteEq }));

  return {
    deleteEq,
    insert,
    remove,
    update,
    updateEq,
  };
});

const errorMocks = vi.hoisted(() => ({
  handleError: vi.fn<(error: unknown, context: string) => void>(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: navigationMocks.refresh }),
}));

vi.mock('@/lib/supabase/browser', () => ({
  getSupabaseBrowserClient: () => ({
    schema: () => ({
      from: () => ({
        delete: browserMocks.remove,
        insert: browserMocks.insert,
        update: browserMocks.update,
      }),
    }),
  }),
}));

vi.mock('@/shared/lib/errors', () => ({
  handleError: errorMocks.handleError,
}));

function createSnapshot(): ZoneManagementSnapshot {
  return {
    fetchedAt: '2026-05-18T10:00:00.000Z',
    groupOptions: [{ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Alpha' }],
    selectedZoneId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    zones: [
      {
        createdAt: '2026-05-18T09:00:00.000Z',
        groupId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        groupName: 'Alpha',
        hasAlexaTrigger: false,
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        isActive: true,
        latitude: 4.61,
        longitude: -74.08,
        name: 'Home',
        radiusMeters: 120,
        recentEventCount: 0,
      },
    ],
  };
}

describe('useZoneManagement', () => {
  beforeEach(() => {
    navigationMocks.refresh.mockReset();
    browserMocks.insert.mockReset();
    browserMocks.update.mockClear();
    browserMocks.updateEq.mockReset();
    browserMocks.remove.mockClear();
    browserMocks.deleteEq.mockReset();
    errorMocks.handleError.mockReset();

    browserMocks.insert.mockResolvedValue({ error: null });
    browserMocks.updateEq.mockResolvedValue({ error: null });
    browserMocks.deleteEq.mockResolvedValue({ error: null });
  });

  it('creates and updates persisted zones with refresh-after-mutation', async () => {
    const snapshot = createSnapshot();
    const { result } = renderHook(() => useZoneManagement({ adminUserId: '11111111-1111-4111-8111-111111111111', snapshot }));

    act(() => {
      result.current.handleStartCreate();
      result.current.handleDraftChange('name', 'Warehouse');
      result.current.handleDraftChange('groupId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
      result.current.handleDraftChange('latitude', '4.63');
      result.current.handleDraftChange('longitude', '-74.06');
      result.current.handleDraftChange('radiusMeters', '150');
    });

    await act(async () => {
      await result.current.handleSaveZone();
    });

    expect(browserMocks.insert).toHaveBeenCalledWith({
      created_by: '11111111-1111-4111-8111-111111111111',
      group_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      is_active: true,
      latitude: 4.63,
      longitude: -74.06,
      name: 'Warehouse',
      radius_meters: 150,
    });

    act(() => {
      result.current.handleSelectZone('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
      result.current.handleDraftChange('name', 'Home Base');
    });

    await act(async () => {
      await result.current.handleSaveZone();
      await result.current.handleToggleZoneActive();
    });

    expect(browserMocks.updateEq).toHaveBeenCalledWith('id', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    expect(navigationMocks.refresh).toHaveBeenCalledTimes(3);
  });

  it('cancels delete confirmation without deleting the selected zone', () => {
    const snapshot = createSnapshot();
    const { result } = renderHook(() => useZoneManagement({ adminUserId: '11111111-1111-4111-8111-111111111111', snapshot }));

    act(() => {
      result.current.handleDeleteRequest();
    });

    expect(result.current.deleteCandidate?.id).toBe('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');

    act(() => {
      result.current.handleDismissDelete();
    });

    expect(result.current.deleteCandidate).toBeNull();
    expect(browserMocks.deleteEq).not.toHaveBeenCalled();
    expect(navigationMocks.refresh).not.toHaveBeenCalled();
  });

  it('deletes the selected zone only after delete confirmation is confirmed', async () => {
    const snapshot = createSnapshot();
    const { result } = renderHook(() => useZoneManagement({ adminUserId: '11111111-1111-4111-8111-111111111111', snapshot }));

    act(() => {
      result.current.handleDeleteRequest();
    });

    expect(browserMocks.deleteEq).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.handleConfirmDelete();
    });

    expect(browserMocks.deleteEq).toHaveBeenCalledWith('id', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    expect(result.current.deleteCandidate).toBeNull();
    expect(navigationMocks.refresh).toHaveBeenCalledTimes(1);
  });

  it('surfaces validation and error handling without mutating', async () => {
    browserMocks.insert.mockResolvedValue({ error: new Error('boom') });

    const snapshot = createSnapshot();
    const { result } = renderHook(() => useZoneManagement({ adminUserId: '11111111-1111-4111-8111-111111111111', snapshot }));

    act(() => {
      result.current.handleStartCreate();
    });

    await act(async () => {
      await result.current.handleSaveZone();
    });

    expect(result.current.validationErrors.name).toBe('Zone name is required.');
    expect(browserMocks.insert).not.toHaveBeenCalled();

    act(() => {
      result.current.handleDraftChange('name', 'Warehouse');
      result.current.handleDraftChange('groupId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
      result.current.handleDraftChange('latitude', '4.63');
      result.current.handleDraftChange('longitude', '-74.06');
      result.current.handleDraftChange('radiusMeters', '150');
    });

    await act(async () => {
      await result.current.handleSaveZone();
    });

    await waitFor(() => {
      expect(errorMocks.handleError).toHaveBeenCalledWith(expect.any(Error), 'useZoneManagement.handleSaveZone');
    });
    expect(navigationMocks.refresh).not.toHaveBeenCalled();
  });
});
