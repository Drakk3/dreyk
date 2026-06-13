import { ZoneManagementWorkspace } from '@/features/zone-management/components/ZoneManagementWorkspace';
import { getZoneManagementSnapshot } from '@/features/zone-management/zoneManagementQuery';
import { requireAdminUser, type AuthUserContext } from '@/lib/auth/authContext';
import { handleError } from '@/shared/lib/errors';

export default async function AdminZonesPage(): Promise<JSX.Element> {
  let authUserContext: AuthUserContext;

  try {
    authUserContext = await requireAdminUser();
  } catch (error: unknown) {
    handleError(error, 'AdminZonesPage');
    throw error;
  }

  try {
    const snapshot = await getZoneManagementSnapshot();

    return (
      <ZoneManagementWorkspace
        adminDisplayName={authUserContext.profile.display_name}
        adminUserId={authUserContext.userId}
        snapshot={snapshot}
      />
    );
  } catch (error: unknown) {
    handleError(error, 'AdminZonesPage.snapshot');
    throw error;
  }
}
