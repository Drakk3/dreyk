'use client';

import { Activity, Lock, Network, Shield, Zap } from 'lucide-react';
import type { FormEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useAuthSignIn } from '@/shared/hooks/useAuthSignIn';

export default function LoginPage(): JSX.Element {
  const {
    email,
    errorMessage,
    handleRememberMeChange,
    handleSignIn,
    isRememberMeEnabled,
    isSubmitDisabled,
    isSubmitting,
    password,
    setEmail,
    setPassword,
  } = useAuthSignIn();

  const handleLoginSubmit = (event: FormEvent<HTMLFormElement>): void => {
    void handleSignIn(event);
  };

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-left md:px-10 lg:px-12">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="flex flex-col justify-between rounded-[14px] border-[0.5px] border-border bg-card/40 p-6 md:p-8">
          <div className="space-y-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-md border-[0.5px] border-border bg-background/60 px-3 py-1 text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
              <Zap className="size-4 text-primary" />
              ARES ACCESS LINK
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
                PWA AUTH SHELL
              </p>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-[0.12em] text-foreground md:text-5xl">
                Secure the web shell before the real product surface lands.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                This Phase 3 access node is intentionally reduced: session bootstrap, role routing,
                and the ARES identity only.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="gap-4 bg-background/70 py-5">
              <CardHeader className="gap-3 px-5">
                <Network className="size-5 text-primary" />
                <CardTitle className="text-sm tracking-[0.14em] uppercase">Route Groups</CardTitle>
              </CardHeader>
              <CardContent className="px-5 text-sm text-muted-foreground">
                Auth, admin, and user paths resolve through server-first guards.
              </CardContent>
            </Card>
            <Card className="gap-4 bg-background/70 py-5">
              <CardHeader className="gap-3 px-5">
                <Shield className="size-5 text-primary" />
                <CardTitle className="text-sm tracking-[0.14em] uppercase">Role Gate</CardTitle>
              </CardHeader>
              <CardContent className="px-5 text-sm text-muted-foreground">
                Admin traffic is isolated before any dashboard or map surface exists.
              </CardContent>
            </Card>
            <Card className="gap-4 bg-background/70 py-5">
              <CardHeader className="gap-3 px-5">
                <Activity className="size-5 text-primary" />
                <CardTitle className="text-sm tracking-[0.14em] uppercase">Scope Lock</CardTitle>
              </CardHeader>
              <CardContent className="px-5 text-sm text-muted-foreground">
                No social login, no product widgets, no Phase 4 profile work.
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="flex items-center">
          <Card className="w-full border-border bg-card/90 py-0">
              <CardHeader className="gap-3 border-b-[0.5px] border-border px-6 py-6">
                <div className="inline-flex w-fit items-center gap-2 rounded-md border-[0.5px] border-border bg-background/70 px-3 py-1 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                <Lock className="size-4 text-primary" />
                DREYK LOGIN
              </div>
              <CardTitle className="text-2xl tracking-[0.12em] uppercase">
                Enter the access corridor
              </CardTitle>
              <CardDescription className="max-w-md text-left leading-6">
                Use your Supabase email and password. The shell will route you to the correct entry
                point after session resolution.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 py-6">
              <form className="space-y-5" onSubmit={handleLoginSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    autoComplete="email"
                    id="email"
                    name="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="ops@dreyk.app"
                    type="email"
                    value={email}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    autoComplete="current-password"
                    id="password"
                    name="password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••••••"
                    type="password"
                    value={password}
                  />
                </div>

                <div className="flex items-center gap-3 rounded-md border-[0.5px] border-border bg-background/60 px-3 py-3">
                  <Checkbox
                    checked={isRememberMeEnabled}
                    id="remember-me"
                    onCheckedChange={(checked) => handleRememberMeChange(checked === true)}
                  />
                  <Label className="text-sm text-muted-foreground" htmlFor="remember-me">
                    Remember this device
                  </Label>
                </div>

                {errorMessage !== null ? (
                  <div className="rounded-md border-[0.5px] border-destructive/50 bg-destructive/10 px-3 py-3 text-sm text-foreground">
                    {errorMessage}
                  </div>
                ) : null}

                <Button className="w-full" disabled={isSubmitDisabled} type="submit">
                  {isSubmitting ? 'Establishing session…' : 'Sign in to DREYK'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
