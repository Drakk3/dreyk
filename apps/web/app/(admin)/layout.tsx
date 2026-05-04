import type { ReactNode } from 'react';

import { requireAdminUser } from '@/lib/auth/authContext';
import { handleError } from '@/shared/lib/errors';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps): Promise<JSX.Element> {
  try {
    await requireAdminUser();
  } catch (error: unknown) {
    handleError(error, 'AdminLayout');
    throw error;
  }

  return <>{children}</>;
}
