'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { AppError, handleError } from '@/shared/lib/errors';

interface UseAuthSignOutResult {
  errorMessage: string | null;
  handleSignOut: () => Promise<void>;
  isSigningOut: boolean;
}

export function useAuthSignOut(): UseAuthSignOutResult {
  // 1. External dependencies (store, supabase, theme)
  const router = useRouter();
  const [supabase] = useState(getSupabaseBrowserClient);

  // 2. Local state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // 3. Derived values (useMemo)

  // 4. Handlers and effects (useCallback, useEffect)
  const handleSignOut = useCallback(async (): Promise<void> => {
    setIsSigningOut(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.signOut();

      if (error !== null) {
        throw new AppError(error.message, 'useAuthSignOut.handleSignOut', error);
      }

      router.replace('/login');
      router.refresh();
    } catch (error: unknown) {
      handleError(error, 'useAuthSignOut.handleSignOut');
      setErrorMessage('Unable to close the current session. Retry the sign out action.');
    } finally {
      setIsSigningOut(false);
    }
  }, [router, supabase]);

  // 5. Single return object — NEVER return an array from a hook
  return {
    errorMessage,
    handleSignOut,
    isSigningOut,
  };
}
