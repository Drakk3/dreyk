import { act, renderHook, waitFor } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetTrackingStore } from '../store/trackingStore';
import { useTrackingController } from './useTrackingController';

interface MockAuthStoreState {
  session: Session | null;
  status: 'anonymous' | 'authenticated' | 'hydrating';
}

const runtimeMocks = vi.hoisted(() => ({
  getTrackingPermissionStatus: vi.fn<() => Promise<'unknown' | 'granted' | 'denied'>>(),
  pauseTrackingRuntime: vi.fn<() => Promise<void>>(),
  requestTrackingPermissions: vi.fn<() => Promise<'unknown' | 'granted' | 'denied'>>(),
  resumeTrackingRuntime: vi.fn<() => Promise<void>>(),
  startTrackingRuntime: vi.fn<() => Promise<void>>(),
}));

const authStoreState = vi.hoisted<MockAuthStoreState>(() => ({
  session: null,
  status: 'anonymous',
}));

vi.mock('../../../shared/lib/errors', () => ({
  handleError: vi.fn(),
}));

vi.mock('../../auth/store/authStore', () => ({
  useAuthStore: <Selected,>(selector: (state: MockAuthStoreState) => Selected): Selected => selector(authStoreState),
}));

vi.mock('../runtime', () => ({
  getTrackingPermissionStatus: runtimeMocks.getTrackingPermissionStatus,
  pauseTrackingRuntime: runtimeMocks.pauseTrackingRuntime,
  requestTrackingPermissions: runtimeMocks.requestTrackingPermissions,
  resumeTrackingRuntime: runtimeMocks.resumeTrackingRuntime,
  startTrackingRuntime: runtimeMocks.startTrackingRuntime,
}));

function createSession(): Session {
  return {
    access_token: 'access-token',
    expires_at: 1_900_000_000,
    expires_in: 3_600,
    refresh_token: 'refresh-token',
    token_type: 'bearer',
    user: {
      app_metadata: {
        provider: 'email',
        providers: ['email'],
      },
      aud: 'authenticated',
      confirmation_sent_at: '2026-05-31T19:00:00.000Z',
      confirmed_at: '2026-05-31T19:00:00.000Z',
      created_at: '2026-05-31T19:00:00.000Z',
      email: 'companion@example.com',
      id: '11111111-1111-4111-8111-111111111111',
      identities: [],
      is_anonymous: false,
      phone: '',
      role: 'authenticated',
      updated_at: '2026-05-31T19:00:00.000Z',
      user_metadata: {},
    },
  };
}

function setAnonymousAuthState(): void {
  authStoreState.session = null;
  authStoreState.status = 'anonymous';
}

function setAuthenticatedAuthState(): void {
  authStoreState.session = createSession();
  authStoreState.status = 'authenticated';
}

describe('useTrackingController', () => {
  beforeEach(() => {
    resetTrackingStore();
    setAnonymousAuthState();
    runtimeMocks.getTrackingPermissionStatus.mockReset();
    runtimeMocks.pauseTrackingRuntime.mockReset();
    runtimeMocks.requestTrackingPermissions.mockReset();
    runtimeMocks.resumeTrackingRuntime.mockReset();
    runtimeMocks.startTrackingRuntime.mockReset();

    runtimeMocks.getTrackingPermissionStatus.mockResolvedValue('unknown');
    runtimeMocks.pauseTrackingRuntime.mockResolvedValue();
    runtimeMocks.requestTrackingPermissions.mockResolvedValue('granted');
    runtimeMocks.resumeTrackingRuntime.mockResolvedValue();
    runtimeMocks.startTrackingRuntime.mockResolvedValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
    resetTrackingStore();
    setAnonymousAuthState();
  });

  it('stays inactive by default until the user explicitly starts tracking', async () => {
    setAuthenticatedAuthState();

    const { result } = renderHook(() => useTrackingController());

    await waitFor(() => {
      expect(result.current.permissionStatus).toBe('unknown');
    });

    expect(result.current.status).toBe('inactive');
    expect(result.current.canStart).toBe(true);
    expect(result.current.canPause).toBe(false);
    expect(result.current.canResume).toBe(false);
  });

  it('blocks start when background permission is denied', async () => {
    setAuthenticatedAuthState();
    runtimeMocks.requestTrackingPermissions.mockResolvedValue('denied');

    const { result } = renderHook(() => useTrackingController());

    await waitFor(() => {
      expect(result.current.permissionStatus).toBe('unknown');
    });

    await act(async () => {
      expect(await result.current.handleStartTracking()).toBe(false);
    });

    expect(runtimeMocks.startTrackingRuntime).not.toHaveBeenCalled();
    expect(result.current.status).toBe('blocked');
    expect(result.current.errorMessage).toBe('Background location permission is required before tracking can start.');
  });

  it('blocks start when no authenticated session exists', async () => {
    const { result } = renderHook(() => useTrackingController());

    await waitFor(() => {
      expect(result.current.permissionStatus).toBe('unknown');
    });

    await act(async () => {
      expect(await result.current.handleStartTracking()).toBe(false);
    });

    expect(runtimeMocks.requestTrackingPermissions).not.toHaveBeenCalled();
    expect(result.current.status).toBe('blocked');
    expect(result.current.errorMessage).toBe('Sign in again before enabling companion tracking.');
  });

  it('supports pause and resume after tracking has started', async () => {
    setAuthenticatedAuthState();
    runtimeMocks.getTrackingPermissionStatus.mockResolvedValue('granted');

    const { result } = renderHook(() => useTrackingController());

    await waitFor(() => {
      expect(result.current.permissionStatus).toBe('granted');
    });

    await act(async () => {
      expect(await result.current.handleStartTracking()).toBe(true);
    });

    expect(result.current.status).toBe('active');

    await act(async () => {
      expect(await result.current.handlePauseTracking()).toBe(true);
    });

    expect(runtimeMocks.pauseTrackingRuntime).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('paused');

    await act(async () => {
      expect(await result.current.handleResumeTracking()).toBe(true);
    });

    expect(runtimeMocks.resumeTrackingRuntime).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('active');
  });
});
