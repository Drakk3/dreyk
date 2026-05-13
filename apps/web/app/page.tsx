import { LauncherHome } from '@/features/launcher/components/LauncherHome';
import { requireAuthenticatedUser, type AuthUserContext } from '@/lib/auth/authContext';
import { handleError } from '@/shared/lib/errors';

export default async function HomePage(): Promise<JSX.Element> {
  try {
    const authUserContext: AuthUserContext = await requireAuthenticatedUser();

    return <LauncherHome profile={authUserContext.profile} role={authUserContext.role} />;
  } catch (error: unknown) {
    handleError(error, 'HomePage');
    throw error;
  }
}
