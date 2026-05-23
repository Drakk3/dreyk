import { GeofencingWorkspace } from '@/features/geofencing/components/GeofencingWorkspace';
import { getGeofencingWorkspaceSnapshot } from '@/features/geofencing/geofencingWorkspaceQuery';
import { parseGeofencingWorkspaceFilterInput, type GeofencingWorkspaceRouteSearchParams } from '@/features/geofencing/services/geofencingWorkspaceFilters';
import { requireAuthenticatedAppUser, type AuthUserContext } from '@/lib/auth/authContext';
import { handleError } from '@/shared/lib/errors';

interface GeofencingPageProps {
  searchParams?: GeofencingWorkspaceRouteSearchParams;
}

export default async function GeofencingPage({ searchParams }: GeofencingPageProps): Promise<JSX.Element> {
  let authUserContext: AuthUserContext;

  try {
    authUserContext = await requireAuthenticatedAppUser();
  } catch (error: unknown) {
    handleError(error, 'GeofencingPage');
    throw error;
  }

  try {
    const snapshot = await getGeofencingWorkspaceSnapshot({
      filters: parseGeofencingWorkspaceFilterInput(searchParams),
      role: authUserContext.role,
      userId: authUserContext.userId,
    });

    return <GeofencingWorkspace profile={authUserContext.profile} role={authUserContext.role} snapshot={snapshot} />;
  } catch (error: unknown) {
    handleError(error, 'GeofencingPage.workspace');
    throw error;
  }
}
