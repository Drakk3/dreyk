import type { Profile } from '@dreyk/shared/types/domain';
import type { Role } from '@dreyk/shared/types/database';
import { redirect } from 'next/navigation';

import { handleError } from '@/shared/lib/errors';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface AuthUserContext {
  profile: Profile;
  role: Role;
  userId: string;
}

interface SessionUser {
  userId: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error !== null || user === null) {
      return null;
    }

    return {
      userId: user.id,
    };
  } catch (error: unknown) {
    handleError(error, 'authContext.getSessionUser');
    return null;
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

    if (error !== null || data === null) {
      return null;
    }

    return data;
  } catch (error: unknown) {
    handleError(error, 'authContext.getProfile');
    return null;
  }
}

export async function getAuthUserContext(): Promise<AuthUserContext | null> {
  try {
    const sessionUser = await getSessionUser();

    if (sessionUser === null) {
      return null;
    }

    const profile = await getProfile(sessionUser.userId);

    if (profile === null || profile.is_active === false) {
      return null;
    }

    return {
      profile,
      role: profile.role,
      userId: sessionUser.userId,
    };
  } catch (error: unknown) {
    handleError(error, 'authContext.getAuthUserContext');
    return null;
  }
}

export async function redirectAuthenticatedUser(): Promise<void> {
  let authUserContext: AuthUserContext | null = null;

  try {
    authUserContext = await getAuthUserContext();
  } catch (error: unknown) {
    handleError(error, 'authContext.redirectAuthenticatedUser');
  }

  if (authUserContext !== null) {
    redirect(getRoleRedirectPath(authUserContext.role));
  }
}

export async function requireAuthenticatedUser(): Promise<AuthUserContext> {
  let authUserContext: AuthUserContext | null = null;

  try {
    authUserContext = await getAuthUserContext();
  } catch (error: unknown) {
    handleError(error, 'authContext.requireAuthenticatedUser');
  }

  if (authUserContext === null) {
    redirect('/login');
  }

  return authUserContext;
}

export async function requireAdminUser(): Promise<AuthUserContext> {
  let authUserContext: AuthUserContext;

  try {
    authUserContext = await requireAuthenticatedUser();
  } catch (error: unknown) {
    handleError(error, 'authContext.requireAdminUser');
    redirect('/app');
  }

  if (authUserContext.role !== 'admin') {
    redirect('/app');
  }

  return authUserContext;
}

export async function requireStandardUser(): Promise<AuthUserContext> {
  let authUserContext: AuthUserContext;

  try {
    authUserContext = await requireAuthenticatedUser();
  } catch (error: unknown) {
    handleError(error, 'authContext.requireStandardUser');
    redirect('/login');
  }

  if (authUserContext.role === 'admin') {
    redirect('/admin');
  }

  return authUserContext;
}

export function getRoleRedirectPath(role: Role): '/admin' | '/app' {
  return role === 'admin' ? '/admin' : '/app';
}
