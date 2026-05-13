import { requireAdminUser, type AuthUserContext } from '@/lib/auth/authContext';
import { handleError } from '@/shared/lib/errors';
import { OpsDashboard } from '@/features/geofencing/components/OpsDashboard';

export default async function AdminLandingPage(): Promise<JSX.Element> {
  let authUserContext: AuthUserContext;

  try {
    authUserContext = await requireAdminUser();
  } catch (error: unknown) {
    handleError(error, 'AdminLandingPage');
    throw error;
  }

  return <OpsDashboard profile={authUserContext.profile} role={authUserContext.role} />;
}
