import type { ReactNode } from 'react';

import { requireAuthenticatedAppUser } from '@/lib/auth/authContext';
import { handleError } from '@/shared/lib/errors';

interface UserLayoutProps {
  children: ReactNode;
}

export default async function UserLayout({ children }: UserLayoutProps): Promise<JSX.Element> {
  try {
    await requireAuthenticatedAppUser();
  } catch (error: unknown) {
    handleError(error, 'UserLayout');
    throw error;
  }

  return <>{children}</>;
}
