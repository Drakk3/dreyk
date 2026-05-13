'use client';

import { ArrowRight, BadgeCheck, Compass, Sparkles } from 'lucide-react';
import Link from 'next/link';

import type { Profile } from '@dreyk/shared/types/domain';
import type { Role } from '@dreyk/shared/types/database';

import { CommandMenu } from '@/components/thegridcn/command-menu';
import { DataCard } from '@/components/thegridcn/data-card';
import { HeroSection } from '@/components/thegridcn/hero-section';
import { Button } from '@/components/ui/button';
import { useGlobalCommandMenu } from '@/shared/command-center/useGlobalCommandMenu';

import { useLauncherHome } from '../hooks/useLauncherHome';

interface LauncherHomeProps {
  profile: Profile;
  role: Role;
}

export function LauncherHome({ profile, role }: LauncherHomeProps): JSX.Element {
  const {
    featureCards,
    initials,
    nowLabel,
    roleLabel,
    workspaceLabel,
  } = useLauncherHome({ profile, role });
  const {
    commandItems,
    handleCommandMenuChange,
    handleCommandMenuOpen,
    handleCommandMenuToggle,
    handleCommandNavigation,
    isCommandMenuOpen,
  } = useGlobalCommandMenu({ currentSurface: 'launcher', role });

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
              <div className="flex items-center gap-2 text-[11px] tracking-[0.24em] text-foreground/50 uppercase">
                <BadgeCheck className="size-3.5 text-primary" />
                <span>{roleLabel}</span>
              </div>
              <p className="truncate font-mono text-sm tracking-[0.18em] uppercase">{profile.display_name}</p>
            </div>
          </div>

          <div className="grid gap-2 md:text-right">
            <div className="font-mono text-[10px] tracking-[0.18em] text-foreground/45 uppercase">{workspaceLabel}</div>
            <div className="font-mono text-[10px] tracking-[0.18em] text-foreground/65 uppercase">{nowLabel}</div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <Button
              className="font-mono text-[10px] tracking-[0.18em] uppercase"
              onClick={handleCommandMenuToggle}
              size="sm"
              type="button"
              variant="outline"
            >
              <Compass className="size-4" />
              Command menu
            </Button>
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center py-10">
            <div className="grid w-full gap-6 lg:max-w-5xl">
              <HeroSection
                badge={
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-2 text-[11px] tracking-[0.22em] text-muted-foreground uppercase backdrop-blur-sm">
                    <Sparkles className="size-4 text-primary" />
                    Authenticated launcher
                  </div>
                }
                description="DREYK now treats the homepage as the authenticated command surface: lightweight, centered, and ready to route you straight into geofencing or life-plan."
                title="Launch the next workspace without leaving the shell."
              />

             <div className="mx-auto w-full max-w-3xl">
              <DataCard status="active" subtitle="Command center" title="Jump directly to a tool">
                <div className="space-y-5 p-6 text-center">
                  <p className="text-sm leading-6 text-muted-foreground">
                    Open the reusable command menu from the center of the launcher or press
                    <span className="mx-2 rounded border border-border/70 bg-background/70 px-2 py-1 font-mono text-[11px] uppercase">
                      ⌘K
                    </span>
                    anytime.
                  </p>

                  <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                     <Button className="min-w-52" onClick={handleCommandMenuOpen} type="button">
                       Open command menu
                     </Button>
                  </div>
                </div>
              </DataCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {featureCards.map((feature) => {
                const FeatureIcon = feature.icon;

                return (
                <DataCard
                  key={feature.key}
                  headerRight={
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-[9px] tracking-[0.18em] text-primary uppercase">
                      {feature.status}
                    </span>
                  }
                  status="active"
                  subtitle={feature.kicker}
                  title={feature.title}
                >
                  <div className="flex h-full flex-col gap-5 p-5">
                    <div className="flex items-center gap-3 text-primary">
                      <div className="rounded-full border border-primary/30 bg-primary/10 p-2">
                        <FeatureIcon className="size-4" />
                      </div>
                      <span className="font-mono text-[10px] tracking-[0.2em] uppercase">Authenticated tool</span>
                    </div>
                    <p className="flex-1 text-sm leading-6 text-foreground/80">{feature.description}</p>
                    <div className="flex flex-wrap items-center gap-3">
                       <Button onClick={() => handleCommandNavigation(feature.href)} type="button">
                         {feature.ctaLabel}
                       </Button>
                      <Link
                        className="inline-flex items-center gap-2 text-xs tracking-[0.18em] text-muted-foreground uppercase transition-colors hover:text-primary"
                        href={feature.href}
                      >
                        Route {feature.href}
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                </DataCard>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <CommandMenu
        items={commandItems}
        label="DREYK / ROOT COMMAND"
        onOpenChange={handleCommandMenuChange}
        open={isCommandMenuOpen}
        placeholder="Search launcher actions…"
      />
    </main>
  );
}
