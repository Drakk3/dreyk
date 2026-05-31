import type { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { handleError } from '../../../shared/lib/errors';
import { getSupabaseMobileClient } from '../../../shared/lib/supabase/mobile';
import { resolveAuthContext } from '../profileResolver';
import {
  createMissingProfileError,
  createSessionRestoreError,
  resolveSessionUserId,
} from '../services/authSession';
import { useAuthStore } from '../store/authStore';
import type { UseAuthBootstrapResult } from '../types';

export function useAuthBootstrap(): UseAuthBootstrapResult {
  // 1. External dependencies (store, router, clients)
  const errorMessage = useAuthStore((state) => state.errorMessage);
  const profile = useAuthStore((state) => state.profile);
  const session = useAuthStore((state) => state.session);
  const status = useAuthStore((state) => state.status);
  const setAnonymous = useAuthStore((state) => state.setAnonymous);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setHydrating = useAuthStore((state) => state.setHydrating);
  const [supabase] = useState(() => getSupabaseMobileClient());

  // 2. Local state

  // 3. Derived values (useMemo)
  const isAuthenticated = useMemo(() => status === 'authenticated' && profile !== null, [profile, status]);
  const isReady = useMemo(() => status !== 'hydrating', [status]);

  // 4. Handlers and effects (useCallback, useEffect)
  const applySession = useCallback(
    async (nextSession: Session | null): Promise<void> => {
      if (nextSession === null) {
        setAnonymous();
        return;
      }

      try {
        const resolvedAuthContext = await resolveAuthContext(supabase, nextSession);

        if (resolvedAuthContext === null) {
          const userId = resolveSessionUserId(nextSession) ?? 'unknown-user';
          const profileError = createMissingProfileError(userId);

          handleError(profileError, 'useAuthBootstrap.applySession');
          await supabase.auth.signOut();
          setAnonymous('Unable to resolve a valid companion profile for this session.');
          return;
        }

        setAuthenticated(resolvedAuthContext);
      } catch (error: unknown) {
        handleError(error, 'useAuthBootstrap.applySession');
        await supabase.auth.signOut();
        setAnonymous('Unable to restore the companion session. Please sign in again.');
      }
    },
    [setAnonymous, setAuthenticated, supabase],
  );

  const bootstrapSession = useCallback(async (): Promise<void> => {
    setHydrating();

    try {
      const {
        data: { session: restoredSession },
        error,
      } = await supabase.auth.getSession();

      if (error !== null) {
        throw createSessionRestoreError(error);
      }

      await applySession(restoredSession);
    } catch (error: unknown) {
      handleError(error, 'useAuthBootstrap.bootstrapSession');
      await supabase.auth.signOut();
      setAnonymous('Unable to restore the companion session. Please sign in again.');
    }
  }, [applySession, setAnonymous, setHydrating, supabase]);

  useEffect(() => {
    let isMounted = true;

    void bootstrapSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted === false) {
        return;
      }

      void applySession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [applySession, bootstrapSession, supabase]);

  // 5. Single return object — NEVER return an array from a hook
  return {
    errorMessage,
    isAuthenticated,
    isReady,
    profile,
    session,
    status,
  };
}
