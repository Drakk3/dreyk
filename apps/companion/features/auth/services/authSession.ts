import type { Profile } from '@dreyk/shared/types/domain';
import type { Session } from '@supabase/supabase-js';

import { AppError } from '../../../shared/lib/errors';

import type { AuthSessionSnapshot, ResolvedAuthContext } from '../types';

export function createHydratingAuthSessionSnapshot(): AuthSessionSnapshot {
  return {
    errorMessage: null,
    profile: null,
    session: null,
    status: 'hydrating',
  };
}

export function createAnonymousAuthSessionSnapshot(errorMessage: string | null = null): AuthSessionSnapshot {
  return {
    errorMessage,
    profile: null,
    session: null,
    status: 'anonymous',
  };
}

export function createAuthenticatedAuthSessionSnapshot(context: ResolvedAuthContext): AuthSessionSnapshot {
  return {
    errorMessage: null,
    profile: context.profile,
    session: context.session,
    status: 'authenticated',
  };
}

export function resolveSessionUserId(session: Session | null): string | null {
  const userId = session?.user.id;

  if (typeof userId !== 'string' || userId.length === 0) {
    return null;
  }

  return userId;
}

export function createResolvedAuthContext(session: Session, profile: Profile | null): ResolvedAuthContext | null {
  const userId = resolveSessionUserId(session);

  if (userId === null || profile === null || profile.id !== userId || profile.is_active === false) {
    return null;
  }

  return {
    profile,
    session,
    userId,
  };
}

export function createMissingProfileError(userId: string): AppError {
  return new AppError(
    `Missing active companion profile for authenticated user ${userId}.`,
    'authSession.createMissingProfileError',
  );
}

export function createSessionRestoreError(cause: unknown): AppError {
  return new AppError(
    'Unable to restore the persisted companion session.',
    'authSession.createSessionRestoreError',
    cause,
  );
}

export function createSignInError(cause: unknown): AppError {
  return new AppError(
    'Unable to establish the companion session with the provided credentials.',
    'authSession.createSignInError',
    cause,
  );
}

export function createSignOutError(cause: unknown): AppError {
  return new AppError('Unable to close the current companion session.', 'authSession.createSignOutError', cause);
}
