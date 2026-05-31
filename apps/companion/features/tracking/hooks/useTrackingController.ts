import { useCallback, useEffect, useMemo, useState } from 'react';

import { handleError } from '../../../shared/lib/errors';
import {
  getTrackingPermissionStatus,
  pauseTrackingRuntime,
  requestTrackingPermissions,
  resumeTrackingRuntime,
  startTrackingRuntime,
} from '../runtime';
import { useTrackingStore } from '../store/trackingStore';
import type { UseTrackingControllerOptions, UseTrackingControllerResult } from '../types';

const PERMISSION_ERROR_MESSAGE = 'Background location permission is required before tracking can start.';
const SESSION_ERROR_MESSAGE = 'Sign in again before enabling companion tracking.';

export function useTrackingController(options: UseTrackingControllerOptions): UseTrackingControllerResult {
  // 1. External dependencies (store, router, clients)
  const { hasSession, isAuthenticated } = options;
  const errorMessage = useTrackingStore((state) => state.errorMessage);
  const lastCapturedAt = useTrackingStore((state) => state.lastCapturedAt);
  const lastUploadedAt = useTrackingStore((state) => state.lastUploadedAt);
  const permissionStatus = useTrackingStore((state) => state.permissionStatus);
  const status = useTrackingStore((state) => state.status);
  const setActive = useTrackingStore((state) => state.setActive);
  const setBlocked = useTrackingStore((state) => state.setBlocked);
  const setErrorMessage = useTrackingStore((state) => state.setErrorMessage);
  const setPaused = useTrackingStore((state) => state.setPaused);
  const setPermissionStatus = useTrackingStore((state) => state.setPermissionStatus);

  // 2. Local state
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 3. Derived values (useMemo)
  const canStart = useMemo(() => status === 'inactive' || status === 'blocked', [status]);
  const canPause = useMemo(() => status === 'active', [status]);
  const canResume = useMemo(() => status === 'paused', [status]);

  // 4. Handlers and effects (useCallback, useEffect)
  const ensureAuthenticatedSession = useCallback((): boolean => {
    if (isAuthenticated === false || hasSession === false) {
      setBlocked(SESSION_ERROR_MESSAGE);
      return false;
    }

    return true;
  }, [hasSession, isAuthenticated, setBlocked]);

  const activateTracking = useCallback(
    async (mode: 'start' | 'resume'): Promise<boolean> => {
      if (ensureAuthenticatedSession() === false) {
        return false;
      }

      setIsTransitioning(true);
      setErrorMessage(null);

      try {
        const nextPermissionStatus = await requestTrackingPermissions();

        setPermissionStatus(nextPermissionStatus);

        if (nextPermissionStatus !== 'granted') {
          setBlocked(PERMISSION_ERROR_MESSAGE);
          return false;
        }

        if (mode === 'start') {
          await startTrackingRuntime();
        } else {
          await resumeTrackingRuntime();
        }

        setActive();
        return true;
      } catch (error: unknown) {
        handleError(error, `useTrackingController.activateTracking.${mode}`);
        setBlocked('Unable to activate background tracking right now.');
        return false;
      } finally {
        setIsTransitioning(false);
      }
    },
    [ensureAuthenticatedSession, setActive, setBlocked, setErrorMessage, setPermissionStatus],
  );

  const handleStartTracking = useCallback(async (): Promise<boolean> => {
    if (canStart === false || isTransitioning) {
      return false;
    }

    return activateTracking('start');
  }, [activateTracking, canStart, isTransitioning]);

  const handlePauseTracking = useCallback(async (): Promise<boolean> => {
    if (canPause === false || isTransitioning) {
      return false;
    }

    setIsTransitioning(true);
    setErrorMessage(null);

    try {
      await pauseTrackingRuntime();
      setPaused();
      return true;
    } catch (error: unknown) {
      handleError(error, 'useTrackingController.handlePauseTracking');
      setErrorMessage('Unable to pause companion tracking right now.');
      return false;
    } finally {
      setIsTransitioning(false);
    }
  }, [canPause, isTransitioning, setErrorMessage, setPaused]);

  const handleResumeTracking = useCallback(async (): Promise<boolean> => {
    if (canResume === false || isTransitioning) {
      return false;
    }

    return activateTracking('resume');
  }, [activateTracking, canResume, isTransitioning]);

  useEffect(() => {
    let isMounted = true;

    void (async (): Promise<void> => {
      try {
        const nextPermissionStatus = await getTrackingPermissionStatus();

        if (isMounted) {
          setPermissionStatus(nextPermissionStatus);
        }
      } catch (error: unknown) {
        handleError(error, 'useTrackingController.getTrackingPermissionStatus');
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [setPermissionStatus]);

  // 5. Single return object — NEVER return an array from a hook
  return {
    canPause,
    canResume,
    canStart,
    errorMessage,
    handlePauseTracking,
    handleResumeTracking,
    handleStartTracking,
    isTransitioning,
    lastCapturedAt,
    lastUploadedAt,
    permissionStatus,
    status,
  };
}
