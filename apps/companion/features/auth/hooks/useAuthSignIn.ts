import { useCallback, useMemo, useState } from 'react';

import { AppError, handleError } from '../../../shared/lib/errors';
import { getSupabaseMobileClient } from '../../../shared/lib/supabase/mobile';
import { resolveAuthContext } from '../profileResolver';
import { createMissingProfileError, createSignInError, resolveSessionUserId } from '../services/authSession';
import { useAuthStore } from '../store/authStore';
import type { AuthCredentials, UseAuthSignInResult } from '../types';

export function useAuthSignIn(): UseAuthSignInResult {
  // 1. External dependencies (store, router, clients)
  const setAnonymous = useAuthStore((state) => state.setAnonymous);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setErrorMessage = useAuthStore((state) => state.setErrorMessage);
  const setHydrating = useAuthStore((state) => state.setHydrating);
  const [supabase] = useState(() => getSupabaseMobileClient());

  // 2. Local state
  const [errorMessage, setLocalErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 3. Derived values (useMemo)
  const canSubmit = useMemo(() => isSubmitting === false, [isSubmitting]);

  // 4. Handlers and effects (useCallback, useEffect)
  const handleSignIn = useCallback(
    async (credentials: AuthCredentials): Promise<boolean> => {
      if (canSubmit === false) {
        return false;
      }

      setIsSubmitting(true);
      setLocalErrorMessage(null);
      setErrorMessage(null);
      setHydrating();

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email.trim(),
          password: credentials.password,
        });

        if (error !== null || data.session === null) {
          throw createSignInError(error ?? new AppError('Supabase returned no active session.', 'useAuthSignIn.handleSignIn'));
        }

        const resolvedAuthContext = await resolveAuthContext(supabase, data.session);

        if (resolvedAuthContext === null) {
          const userId = resolveSessionUserId(data.session) ?? 'unknown-user';

          await supabase.auth.signOut();
          throw createMissingProfileError(userId);
        }

        setAuthenticated(resolvedAuthContext);
        return true;
      } catch (error: unknown) {
        const message = 'Unable to establish the companion session. Verify your credentials and retry.';

        handleError(error, 'useAuthSignIn.handleSignIn');
        setAnonymous(message);
        setLocalErrorMessage(message);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [canSubmit, setAnonymous, setAuthenticated, setErrorMessage, setHydrating, supabase],
  );

  // 5. Single return object — NEVER return an array from a hook
  return {
    errorMessage,
    handleSignIn,
    isSubmitting,
  };
}
