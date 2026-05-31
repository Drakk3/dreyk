import type { Profile } from '@dreyk/shared/types/domain';
import type { Session } from '@supabase/supabase-js';

export type AuthStatus = 'hydrating' | 'anonymous' | 'authenticated';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthSessionSnapshot {
  errorMessage: string | null;
  profile: Profile | null;
  session: Session | null;
  status: AuthStatus;
}

export interface ResolvedAuthContext {
  profile: Profile;
  session: Session;
  userId: string;
}

export interface UseAuthBootstrapResult {
  errorMessage: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  profile: Profile | null;
  session: Session | null;
  status: AuthStatus;
}

export interface UseAuthSignInResult {
  errorMessage: string | null;
  handleSignIn: (credentials: AuthCredentials) => Promise<boolean>;
  isSubmitting: boolean;
}

export interface UseAuthSignOutResult {
  errorMessage: string | null;
  handleSignOut: () => Promise<boolean>;
  isSigningOut: boolean;
}
