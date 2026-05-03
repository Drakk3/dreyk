import { redirect } from 'next/navigation';

import { getAuthUserContext, getRoleRedirectPath, type AuthUserContext } from '@/lib/auth/authContext';
import { handleError } from '@/shared/lib/errors';

export default async function HomePage(): Promise<never> {
  let authUserContext: AuthUserContext | null = null;

  try {
    authUserContext = await getAuthUserContext();
  } catch (error: unknown) {
    handleError(error, 'HomePage');
  }

  if (authUserContext === null) {
    redirect('/login');
  }

  redirect(getRoleRedirectPath(authUserContext.role));
}
