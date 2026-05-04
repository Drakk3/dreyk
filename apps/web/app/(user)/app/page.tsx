import { requireStandardUser, type AuthUserContext } from '@/lib/auth/authContext';
import { handleError } from '@/shared/lib/errors';
import { OpsDashboard } from '@/features/geofencing/components/OpsDashboard';

export default async function UserLandingPage(): Promise<JSX.Element> {
  let authUserContext: AuthUserContext;

  try {
    authUserContext = await requireStandardUser();
  } catch (error: unknown) {
    handleError(error, 'UserLandingPage');
    throw error;
  }

  return <OpsDashboard profile={authUserContext.profile} role={authUserContext.role} />;
}
