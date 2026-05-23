'use client';

import * as React from 'react';

import type { Profile } from '@dreyk/shared/types/domain';
import type { Role } from '@dreyk/shared/types/database';

import { CommandMenu } from '@/components/thegridcn/command-menu';
import { Tabs } from '@/components/thegridcn/tabs';
import { useGlobalCommandMenu } from '@/shared/command-center/useGlobalCommandMenu';
import type { SharedCommandMenuItem } from '@/shared/command-center/types';
import { AppSidebar } from '@/shared/components/app-shell/AppSidebar';
import { AppTopbar } from '@/shared/components/app-shell/AppTopbar';

import { useFitnessDashboard } from '../hooks/useFitnessDashboard';
import {
  FITNESS_DEFAULT_SECTION,
  FITNESS_NAV_ITEMS,
  FITNESS_NAV_SECTIONS,
  isFitnessSectionKey,
} from '../navigation';
import type { FitnessSectionKey } from '../types';
import { FitnessAthletePanel } from './FitnessAthletePanel';
import { FitnessGoalsPanel } from './FitnessGoalsPanel';
import { FitnessNutritionPanel } from './FitnessNutritionPanel';

interface FitnessDashboardProps {
  initialSection: FitnessSectionKey;
  profile: Profile;
  role: Role;
}

function getInitials(displayName: string): string {
  return displayName
    .split(/[\s._-]+/)
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getStatusLabel(activeSection: FitnessSectionKey): string {
  if (activeSection === 'juan') {
    return 'JUAN / VOLUMEN LIMPIO';
  }

  if (activeSection === 'yasmis') {
    return 'YASMIS / PÉRDIDA DE GRASA';
  }

  if (activeSection === 'nutrition') {
    return 'NUTRICIÓN / PLAN ESTÁTICO';
  }

  return 'METAS / REGLAS / TIMELINE';
}

export function FitnessDashboard({ initialSection, profile, role }: FitnessDashboardProps): JSX.Element {
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = React.useState<boolean>(true);
  const { activeSection, handleSectionChange, planDocument, progressPercentage, tabs, timelineItems } = useFitnessDashboard({
    initialSection,
  });

  const initials = getInitials(profile.display_name);

  const localCommandItems = React.useMemo<SharedCommandMenuItem[]>(() => {
    return FITNESS_NAV_ITEMS.map((item, index) => ({
      group: 'NAVIGATE',
      label: `Open ${item.label}`,
      onSelect: () => handleSectionChange(item.key),
      shortcut: `F ${index + 1}`,
      description: `Focus the ${item.label.toLowerCase()} section inside fitness.`,
    }));
  }, [handleSectionChange]);

  const {
    commandItems,
    handleCommandMenuChange,
    handleCommandMenuOpen,
    isCommandMenuOpen,
  } = useGlobalCommandMenu({ currentSurface: 'fitness', localItems: localCommandItems, role });

  const juanPlan = planDocument.athletes.find((athlete) => athlete.id === 'juan');
  const yasmisPlan = planDocument.athletes.find((athlete) => athlete.id === 'yasmis');

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 circuit-bg" />
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(circle at 80% -10%, color-mix(in oklch, var(--primary) 10%, transparent), transparent 50%), radial-gradient(circle at -10% 110%, rgba(251, 191, 36, 0.08), transparent 42%)',
        }}
      />

      <AppSidebar
        activeItemKey={activeSection}
        brandName="DREYK"
        brandTagline="FITNESS / 2026 PLAN"
        isDesktopOpen={isDesktopSidebarOpen}
        navSections={FITNESS_NAV_SECTIONS}
        onItemSelect={(key: string) => {
          if (isFitnessSectionKey(key)) {
            handleSectionChange(key);
          }
        }}
        userDisplayName={profile.display_name}
        userInitials={initials}
        userRoleLabel={`${role.toUpperCase()} · FITNESS`}
      />

      <div className="relative flex min-h-screen min-w-0 flex-1 flex-col">
        <AppTopbar
          breadcrumbs={['PWA / WEB', 'PERSONAL OPS', 'FITNESS PLAN 2026']}
          highlightedBreadcrumbIndex={2}
          initials={initials}
          onCommandOpen={handleCommandMenuOpen}
          onDesktopSidebarToggle={() => setIsDesktopSidebarOpen((currentValue) => !currentValue)}
          statusLabel={getStatusLabel(activeSection)}
          isDesktopSidebarOpen={isDesktopSidebarOpen}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="space-y-6 px-6 py-7">
            <section className="px-1 py-2 lg:px-2 lg:py-3">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
                    Session · {profile.display_name.toUpperCase()} / {role.toUpperCase()} · fitness
                  </div>
                  <h1 className="mt-3 flex items-center gap-3 text-[28px] font-semibold tracking-[-0.02em] text-foreground sm:text-[32px]">
                    <span className="font-mono text-3xl text-primary/85">|</span>
                    {planDocument.header.title}
                  </h1>
                  <p className="mt-3 max-w-2xl font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/38">
                    {planDocument.header.subtitle}
                  </p>
                </div>

                <div className="space-y-2 border-l border-border/60 pl-4 text-right font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/42 lg:min-w-[240px]">
                  <div>
                    <span className="text-foreground/30">Inicio</span> · {planDocument.dates.startLabel}
                  </div>
                  <div>
                    <span className="text-foreground/30">Checkpoint</span> ·{' '}
                    <span className="text-emerald-300">{planDocument.dates.checkpointLabel}</span>
                  </div>
                  <div>
                    <span className="text-foreground/30">Meta final</span> ·{' '}
                    <span className="text-emerald-300">{planDocument.dates.endLabel}</span>
                  </div>
                </div>
              </div>
            </section>

            <Tabs
              tabs={tabs}
              value={activeSection}
              onChange={(value: string) => {
                if (isFitnessSectionKey(value)) {
                  handleSectionChange(value);
                }
              }}
              variant="underline"
              size="sm"
            />

            {activeSection === 'juan' && juanPlan !== undefined ? <FitnessAthletePanel athlete={juanPlan} /> : null}
            {activeSection === 'yasmis' && yasmisPlan !== undefined ? <FitnessAthletePanel athlete={yasmisPlan} /> : null}
            {activeSection === 'nutrition' ? (
              <FitnessNutritionPanel
                hydrationNote={planDocument.hydrationNote}
                mealPlans={planDocument.nutritionMealPlans}
                nutritionProfiles={planDocument.nutrition}
              />
            ) : null}
            {activeSection === 'goals' ? (
              <FitnessGoalsPanel
                expectedResults={planDocument.expectedResults}
                milestones={planDocument.goals}
                progressPercentage={progressPercentage}
                rules={planDocument.rules}
                timelineItems={timelineItems}
              />
            ) : null}

            <footer className="flex items-center justify-between gap-4 pb-4 pt-2 font-mono text-[10px] uppercase tracking-widest text-foreground/30">
              <span>DREYK / FITNESS PLAYBOOK</span>
              <span>{activeSection === FITNESS_DEFAULT_SECTION ? 'UPPER / LOWER + FULL BODY' : 'STATIC WORKSPACE · NO PERSISTENCE'}</span>
            </footer>
          </div>
        </main>
      </div>

      <CommandMenu
        items={commandItems}
        label="DREYK / FITNESS COMMAND"
        onOpenChange={handleCommandMenuChange}
        open={isCommandMenuOpen}
        placeholder="Search fitness sections or global workspaces…"
      />
    </div>
  );
}
