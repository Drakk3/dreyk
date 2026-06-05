import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RealtimeSnapshotPayload, RealtimeSnapshotRefreshConfig, RealtimeSnapshotTable } from './types';

import { useRealtimeSnapshotRefresh } from './useRealtimeSnapshotRefresh';

interface RegisteredRealtimeListener {
  callback: (payload: RealtimeSnapshotPayload) => void;
  schema: string;
  table: string;
}

interface MockRealtimeChannel {
  on: (
    event: 'postgres_changes',
    filter: { event: '*'; schema: string; table: string },
    callback: (payload: RealtimeSnapshotPayload) => void,
  ) => MockRealtimeChannel;
  subscribe: () => MockRealtimeChannel;
}

const navigationMocks = vi.hoisted(() => ({
  refresh: vi.fn<() => void>(),
}));

const supabaseMocks = vi.hoisted(() => {
  const listeners: RegisteredRealtimeListener[] = [];

  const channel: MockRealtimeChannel = {
    on: (_event, filter, callback) => {
      listeners.push({ callback, schema: filter.schema, table: filter.table });
      return channel;
    },
    subscribe: () => channel,
  };

  return {
    channel: vi.fn<(name: string) => MockRealtimeChannel>(() => channel),
    listeners,
    removeChannel: vi.fn<() => Promise<'ok'>>().mockResolvedValue('ok'),
    reset: (): void => {
      listeners.length = 0;
    },
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: navigationMocks.refresh }),
}));

vi.mock('@/lib/supabase/browser', () => ({
  getSupabaseBrowserClient: () => ({
    channel: supabaseMocks.channel,
    removeChannel: supabaseMocks.removeChannel,
  }),
}));

vi.mock('@/shared/lib/errors', () => ({
  handleError: vi.fn<(error: unknown, context: string) => void>(),
}));

function createConfig(tables: RealtimeSnapshotTable[]): RealtimeSnapshotRefreshConfig {
  return {
    scope: 'geofencing',
    tables: tables.map((table) => ({ schema: 'public', table })),
    throttleMs: 1500,
  };
}

function createPayload(table: RealtimeSnapshotTable, overrides?: Partial<RealtimeSnapshotPayload>): RealtimeSnapshotPayload {
  return {
    commit_timestamp: '2026-05-31T21:40:00.000Z',
    errors: [],
    eventType: 'UPDATE',
    new: { id: `${table}-1` },
    old: { id: `${table}-1` },
    schema: 'public',
    table,
    ...overrides,
  };
}

function emitPayload(table: RealtimeSnapshotTable, payload: RealtimeSnapshotPayload): void {
  supabaseMocks.listeners
    .filter((listener) => listener.table === table)
    .forEach((listener) => {
      listener.callback(payload);
    });
}

describe('useRealtimeSnapshotRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    navigationMocks.refresh.mockReset();
    supabaseMocks.channel.mockClear();
    supabaseMocks.removeChannel.mockClear();
    supabaseMocks.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('collapses burst updates into one trailing refresh', () => {
    renderHook(() => useRealtimeSnapshotRefresh(createConfig(['zones', 'groups'])));

    emitPayload('zones', createPayload('zones', { commit_timestamp: '2026-05-31T21:40:00.000Z' }));
    emitPayload('groups', createPayload('groups', { commit_timestamp: '2026-05-31T21:40:00.500Z', new: { id: 'group-1' }, old: { id: 'group-1' } }));

    expect(navigationMocks.refresh).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1499);
    expect(navigationMocks.refresh).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(navigationMocks.refresh).toHaveBeenCalledTimes(1);
  });

  it('refreshes for slower streams outside the throttle window', () => {
    renderHook(() => useRealtimeSnapshotRefresh(createConfig(['zones'])));

    emitPayload('zones', createPayload('zones', { commit_timestamp: '2026-05-31T21:40:00.000Z' }));
    vi.advanceTimersByTime(1500);

    emitPayload('zones', createPayload('zones', { commit_timestamp: '2026-05-31T21:40:03.000Z', new: { id: 'zones-2' }, old: { id: 'zones-2' } }));
    vi.advanceTimersByTime(1500);

    expect(navigationMocks.refresh).toHaveBeenCalledTimes(2);
  });

  it('suppresses duplicate payloads inside the same mounted bridge', () => {
    renderHook(() => useRealtimeSnapshotRefresh(createConfig(['zones'])));

    const duplicatePayload = createPayload('zones');

    emitPayload('zones', duplicatePayload);
    emitPayload('zones', duplicatePayload);
    vi.advanceTimersByTime(1500);

    emitPayload('zones', duplicatePayload);
    vi.advanceTimersByTime(1500);

    expect(navigationMocks.refresh).toHaveBeenCalledTimes(1);
  });

  it('ignores tables outside the route config', () => {
    renderHook(() => useRealtimeSnapshotRefresh(createConfig(['zones'])));

    emitPayload('groups', createPayload('groups'));
    vi.advanceTimersByTime(1500);

    expect(supabaseMocks.listeners).toHaveLength(1);
    expect(supabaseMocks.listeners[0]?.table).toBe('zones');
    expect(navigationMocks.refresh).not.toHaveBeenCalled();
  });

  it('clears pending timers and removes the realtime channel on unmount', () => {
    const { unmount } = renderHook(() => useRealtimeSnapshotRefresh(createConfig(['zones'])));

    emitPayload('zones', createPayload('zones'));
    unmount();
    vi.advanceTimersByTime(1500);

    expect(navigationMocks.refresh).not.toHaveBeenCalled();
    expect(supabaseMocks.removeChannel).toHaveBeenCalledTimes(1);
  });
});
