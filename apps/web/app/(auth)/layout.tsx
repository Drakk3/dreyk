import type { ReactNode } from 'react';

import { redirectAuthenticatedUser } from '@/lib/auth/authContext';
import { handleError } from '@/shared/lib/errors';

interface AuthLayoutProps {
  children: ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps): Promise<JSX.Element> {
  try {
    await redirectAuthenticatedUser();
  } catch (error: unknown) {
    handleError(error, 'AuthLayout');
    throw error;
  }

  return <>{children}</>;
}
