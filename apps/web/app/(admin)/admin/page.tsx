import Link from 'next/link';

import { ShieldAlert } from 'lucide-react';

import { AlertBanner } from '@/components/thegridcn/alert';
import { Button } from '@/components/ui/button';
import { requireAdminUser, type AuthUserContext } from '@/lib/auth/authContext';
import { handleError } from '@/shared/lib/errors';

function getInitials(displayName: string): string {
  return displayName
    .split(/[\s._-]+/)
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default async function AdminLandingPage(): Promise<JSX.Element> {
  let authUserContext: AuthUserContext;

  try {
    authUserContext = await requireAdminUser();
  } catch (error: unknown) {
    handleError(error, 'AdminLandingPage');
    throw error;
  }

  const initials = getInitials(authUserContext.profile.display_name);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 circuit-bg" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, color-mix(in oklch, var(--primary) 16%, transparent), transparent 42%), radial-gradient(circle at 50% 100%, color-mix(in oklch, var(--accent) 10%, transparent), transparent 38%)',
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-20 flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/65 px-4 py-3 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full border border-primary/40 bg-primary/10 font-mono text-sm text-primary">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-foreground/50">
                <ShieldAlert className="size-3.5 text-primary" />
                <span>Admin-only workspace</span>
              </div>
              <p className="truncate font-mono text-sm uppercase tracking-[0.18em]">
                {authUserContext.profile.display_name}
              </p>
            </div>
          </div>

          <div className="grid gap-2 md:text-right">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/45">
              DREYK / ADMIN PANEL
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/65">
              Placeholder shell while admin tools are being rebuilt
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <Button asChild size="sm" variant="outline">
              <Link className="font-mono text-[10px] uppercase tracking-[0.18em]" href="/">
                Back to launcher
              </Link>
            </Button>
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center py-10">
          <div className="grid w-full max-w-3xl gap-6">
            <div className="space-y-3 text-center">
              <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary">Admin surface</div>
              <h1 className="text-3xl uppercase tracking-[0.22em] text-foreground">Panel in development</h1>
              <p className="text-sm leading-6 text-muted-foreground">
                The launcher remains the primary shell for authenticated users. This admin route stays protected,
                but its dedicated controls are intentionally paused until the next implementation slice.
              </p>
            </div>

            <AlertBanner
              subtitle="Restricted access"
              title="Admin panel is currently under development"
              variant="warning"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
