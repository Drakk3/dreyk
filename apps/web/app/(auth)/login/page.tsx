'use client';

import { Eye, EyeOff, Lock, Shield, Zap } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';

import { CircuitBackground } from '@/components/thegridcn/CircuitBackground';
import { GlowContainer } from '@/components/thegridcn/GlowContainer';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { DataCard } from '@/components/ui/DataCard';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useAuthSignIn } from '@/shared/hooks/useAuthSignIn';

interface DecorativePanelItem {
  description: string;
  title: string;
}

const DECORATIVE_PANEL_ITEMS: DecorativePanelItem[] = [
  {
    title: 'AUTH / ADMIN / USER',
    description: 'Server-first route groups stay isolated until session resolution.',
  },
  {
    title: 'ARES SIGNAL',
    description: 'Glow and circuit layers preserve the supplied visual shell.',
  },
  {
    title: 'PHASE 3 ACCESS',
    description: 'Only email and password entry remain exposed in this corridor.',
  },
];

export default function LoginPage(): JSX.Element {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
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

  const handlePasswordVisibilityToggle = (): void => {
    setIsPasswordVisible((currentValue) => !currentValue);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-6 py-8 text-left md:px-10 lg:px-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,109,72,0.12),transparent_42%)]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="hidden lg:flex lg:items-center">
          <CircuitBackground className="min-h-[60vh] w-full rounded-[28px] border-[0.5px] border-border bg-card/35" opacity={0.22}>
            <div className="flex min-h-[60vh] flex-col justify-center gap-10 p-8 xl:p-10">
              <div className="space-y-6">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border-[0.5px] border-border bg-background/70 px-4 py-2 text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase backdrop-blur-sm">
                  <Zap className="size-4 text-primary" />
                  ARES ACCESS LINK
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-medium tracking-[0.22em] text-muted-foreground uppercase">
                    PWA AUTH SHELL
                  </p>
                  <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-[0.12em] text-foreground xl:text-5xl">
                    Secure the web shell before the real product surface lands.
                  </h1>
                  <p className="max-w-xl text-base leading-7 text-muted-foreground xl:text-lg">
                    This Phase 3 access node stays intentionally reduced: session bootstrap, role
                    routing, and the ARES identity only.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                {DECORATIVE_PANEL_ITEMS.map((item) => (
                  <DataCard key={item.title} className="h-full" fields={[]} status="active" subtitle="ACCESS" title={item.title}>
                    <div className="space-y-4 p-4 pt-3">
                      <div className="flex items-center gap-3 text-primary">
                        <Shield className="size-4" />
                      </div>
                      <p className="text-sm leading-6 text-foreground/85">{item.description}</p>
                    </div>
                  </DataCard>
                ))}
              </div>
            </div>
          </CircuitBackground>
        </section>

        <section className="flex items-center justify-center">
          <GlowContainer className="w-full max-w-xl p-0 lg:min-h-[60vh]" hover={false} intensity="lg">
            <DataCard className="flex flex-col justify-center lg:min-h-[60vh]" fields={[]} status="active">
              <div className="space-y-4 border-b-[0.5px] border-border/80 px-6 py-7 md:px-8">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border-[0.5px] border-border bg-background/75 px-4 py-2 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                  <Lock className="size-4 text-primary" />
                  DREYK LOGIN
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl tracking-[0.12em] text-foreground uppercase md:text-3xl">
                    Enter the access corridor
                  </h2>
                  <p className="max-w-md text-left leading-6 text-muted-foreground">
                    Use your Supabase email and password. The shell will route you to the correct
                    entry point after session resolution.
                  </p>
                </div>
              </div>

              <div className="px-6 py-7 md:px-8">
                <form className="space-y-5" onSubmit={handleLoginSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      autoComplete="email"
                      className="h-11 rounded-xl bg-background/70"
                      id="email"
                      name="email"
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="ops@dreyk.app"
                      type="email"
                      value={email}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="password">Password</Label>
                      <span className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                        Secure entry
                      </span>
                    </div>

                    <div className="relative">
                      <Input
                        autoComplete="current-password"
                        className="h-11 rounded-xl bg-background/70 pr-12"
                        id="password"
                        name="password"
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="••••••••••••"
                        type={isPasswordVisible ? 'text' : 'password'}
                        value={password}
                      />
                      <Button
                        aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                        className="absolute top-1/2 right-1 size-9 -translate-y-1/2 rounded-lg"
                        onClick={handlePasswordVisibilityToggle}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border-[0.5px] border-border bg-background/60 px-4 py-3">
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
                    <div className="rounded-xl border-[0.5px] border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-foreground">
                      {errorMessage}
                    </div>
                  ) : null}

                  <Button className="h-11 w-full rounded-xl" disabled={isSubmitDisabled} type="submit">
                    {isSubmitting ? 'Establishing session…' : 'Sign in to DREYK'}
                  </Button>
                </form>
              </div>
            </DataCard>
          </GlowContainer>
        </section>
      </div>
    </main>
  );
}
