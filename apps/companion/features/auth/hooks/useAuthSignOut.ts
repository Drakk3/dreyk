import { useCallback, useMemo, useState } from 'react';

import { handleError } from '../../../shared/lib/errors';
import { getSupabaseMobileClient } from '../../../shared/lib/supabase/mobile';
import { createSignOutError } from '../services/authSession';
import { useAuthStore } from '../store/authStore';
import type { UseAuthSignOutResult } from '../types';

export function useAuthSignOut(): UseAuthSignOutResult {
  // 1. External dependencies (store, router, clients)
  const clearSession = useAuthStore((state) => state.clearSession);
  const setErrorMessage = useAuthStore((state) => state.setErrorMessage);
  const [supabase] = useState(() => getSupabaseMobileClient());

  // 2. Local state
  const [errorMessage, setLocalErrorMessage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // 3. Derived values (useMemo)
  const canSignOut = useMemo(() => isSigningOut === false, [isSigningOut]);

  // 4. Handlers and effects (useCallback, useEffect)
  const handleSignOut = useCallback(async (): Promise<boolean> => {
    if (canSignOut === false) {
      return false;
    }

    setIsSigningOut(true);
    setLocalErrorMessage(null);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.signOut();

      if (error !== null) {
        throw createSignOutError(error);
      }

      clearSession();
      return true;
    } catch (error: unknown) {
      const message = 'Unable to close the companion session. Retry the sign out action.';

      handleError(error, 'useAuthSignOut.handleSignOut');
      setErrorMessage(message);
      setLocalErrorMessage(message);
      return false;
    } finally {
      setIsSigningOut(false);
    }
  }, [canSignOut, clearSession, setErrorMessage, supabase]);

  // 5. Single return object — NEVER return an array from a hook
  return {
    errorMessage,
    handleSignOut,
    isSigningOut,
  };
}
