import { OpsDashboard } from '@/features/geofencing/components/OpsDashboard';
import { requireAuthenticatedAppUser, type AuthUserContext } from '@/lib/auth/authContext';
import { handleError } from '@/shared/lib/errors';

export default async function GeofencingPage(): Promise<JSX.Element> {
  let authUserContext: AuthUserContext;

  try {
    authUserContext = await requireAuthenticatedAppUser();
  } catch (error: unknown) {
    handleError(error, 'GeofencingPage');
    throw error;
  }

  return <OpsDashboard profile={authUserContext.profile} role={authUserContext.role} />;
}
