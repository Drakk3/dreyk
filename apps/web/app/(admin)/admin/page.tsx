import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { requireAdminUser, type AuthUserContext } from '@/lib/auth/authContext';
import { SessionSignOutButton } from '@/shared/components/SessionSignOutButton';
import { handleError } from '@/shared/lib/errors';

export default async function AdminLandingPage(): Promise<JSX.Element> {
  let authUserContext: AuthUserContext;

  try {
    authUserContext = await requireAdminUser();
  } catch (error: unknown) {
    handleError(error, 'AdminLandingPage');
    throw error;
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-left md:px-10">
      <div className="mx-auto max-w-4xl">
        <Card className="bg-card/90">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl tracking-[0.12em] uppercase">Admin entry shell</CardTitle>
                <CardDescription>
                  Role access confirmed for {authUserContext.profile.display_name}. Dashboard modules are
                  intentionally deferred beyond Phase 3.
                </CardDescription>
              </div>
              <SessionSignOutButton />
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This landing page exists only to prove session resolution and admin guard behavior.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
