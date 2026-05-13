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

import { useLifePlanDashboard } from '../hooks/useLifePlanDashboard';
import {
  isLifePlanSectionKey,
  LIFE_PLAN_NAV_ITEMS,
  LIFE_PLAN_NAV_SECTIONS,
} from '../navigation';
import type { LifePlanSectionKey } from '../types';
import { ContingencyCard } from './ContingencyCard';
import { FinancialProjectionCard } from './FinancialProjectionCard';
import { LifePlanHeroCard } from './LifePlanHeroCard';
import { LifePlanKpiStrip } from './LifePlanKpiStrip';
import { PriorityActionsCard } from './PriorityActionsCard';
import { TeachingPathCard } from './TeachingPathCard';

interface LifePlanDashboardProps {
  initialSection: LifePlanSectionKey;
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

export function LifePlanDashboard({ initialSection, profile, role }: LifePlanDashboardProps): JSX.Element {
  const {
    contingencyPlan,
    financialProjection,
    handleHorizonChange,
    handleScenarioChange,
    horizonOptions,
    priorityActions,
    selectedHorizonMonths,
    selectedScenario,
    selectedScenarioId,
    snapshot,
    teachingPath,
  } = useLifePlanDashboard();

  const [activeSection, setActiveSection] = React.useState<LifePlanSectionKey>(initialSection);

  const initials = getInitials(profile.display_name);

  React.useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  const localCommandItems = React.useMemo<SharedCommandMenuItem[]>(() => {
    return LIFE_PLAN_NAV_ITEMS.map((item, index) => ({
      group: 'NAVIGATE',
      label: item.label,
      onSelect: () => setActiveSection(item.key),
      shortcut: `⌘ ${index + 1}`,
      description: `Focus the ${item.label.toLowerCase()} section inside life plan.`,
    }));
  }, []);

  const {
    commandItems,
    handleCommandMenuChange,
    handleCommandMenuOpen,
    isCommandMenuOpen,
  } = useGlobalCommandMenu({ currentSurface: 'life-plan', localItems: localCommandItems, role });

  const topTabs = React.useMemo(() => {
    return LIFE_PLAN_NAV_ITEMS.map((item) => ({ label: item.label, value: item.key }));
  }, []);

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 circuit-bg" />
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(circle at 80% -10%, color-mix(in oklch, var(--primary) 10%, transparent), transparent 50%), radial-gradient(circle at -10% 110%, color-mix(in oklch, var(--accent) 8%, transparent), transparent 50%)',
        }}
      />

      <AppSidebar
        activeItemKey={activeSection}
        brandName="DREYK"
        brandTagline="LIFE PLAN / MVP"
        navSections={LIFE_PLAN_NAV_SECTIONS}
        onItemSelect={(key: string) => {
          if (isLifePlanSectionKey(key)) {
            setActiveSection(key);
          }
        }}
        userDisplayName={profile.display_name}
        userInitials={initials}
        userRoleLabel={`${role.toUpperCase()} · LIFE PLAN`}
      />

      <div className="relative flex min-h-screen min-w-0 flex-1 flex-col">
        <AppTopbar
          breadcrumbs={['PWA / WEB · APPS/WEB', 'STANDARD USER', 'LIFE PLAN DASHBOARD']}
          highlightedBreadcrumbIndex={2}
          initials={initials}
          onCommandOpen={handleCommandMenuOpen}
          statusLabel="MOCK STATUS · JUAN DAVID / CUMARAL"
        />

        <main className="flex-1 overflow-y-auto">
          <div className="space-y-5 px-6 py-6">
            <div className="space-y-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
                  Session · {profile.display_name.toUpperCase()} / {role.toUpperCase()} · life-plan
                </div>
                <h1 className="mt-1 flex items-center gap-3 text-2xl uppercase tracking-[0.22em]">
                  <span className="font-mono text-3xl text-primary">|</span>
                  LIFE PLAN / EXECUTION
                </h1>
                <p className="mt-1 text-sm uppercase tracking-[0.12em] text-muted-foreground">
                  Dashboard mock-first para docencia pública, caja y contingencias en Meta.
                </p>
              </div>

              <Tabs
                tabs={topTabs}
                value={activeSection}
                onChange={(value: string) => {
                  if (isLifePlanSectionKey(value)) {
                    setActiveSection(value);
                  }
                }}
                variant="pills"
                size="sm"
              />
            </div>

            <LifePlanHeroCard currentMilestone={teachingPath.currentMilestone} snapshot={snapshot} />
            <LifePlanKpiStrip
              contingencyPlan={contingencyPlan}
              financialProjection={financialProjection}
              priorityActions={priorityActions}
              teachingPath={teachingPath}
            />

            {activeSection === 'overview' ? (
              <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
                <FinancialProjectionCard
                  debts={snapshot.debts}
                  financialProjection={financialProjection}
                  handleHorizonChange={handleHorizonChange}
                  handleScenarioChange={handleScenarioChange}
                  horizonOptions={horizonOptions}
                  scenarios={snapshot.scenarios}
                  selectedHorizonMonths={selectedHorizonMonths}
                  selectedScenario={selectedScenario}
                  selectedScenarioId={selectedScenarioId}
                />
                <div className="space-y-4">
                  <TeachingPathCard teachingPath={teachingPath} />
                  <ContingencyCard contingencyPlan={contingencyPlan} />
                </div>
              </div>
            ) : null}

            {activeSection === 'finances' ? (
              <FinancialProjectionCard
                debts={snapshot.debts}
                financialProjection={financialProjection}
                handleHorizonChange={handleHorizonChange}
                handleScenarioChange={handleScenarioChange}
                horizonOptions={horizonOptions}
                scenarios={snapshot.scenarios}
                selectedHorizonMonths={selectedHorizonMonths}
                selectedScenario={selectedScenario}
                selectedScenarioId={selectedScenarioId}
              />
            ) : null}

            {activeSection === 'teaching' ? <TeachingPathCard teachingPath={teachingPath} /> : null}
            {activeSection === 'contingencies' ? (
              <ContingencyCard contingencyPlan={contingencyPlan} />
            ) : null}

            <PriorityActionsCard priorityActions={priorityActions} />

            <footer className="flex items-center justify-between gap-4 pb-4 pt-2 font-mono text-[10px] uppercase tracking-widest text-foreground/30">
              <span>DREYK / LIFE PLAN PREVIEW · BUILT ON THEGRIDCN · ARES THEME</span>
              <span>PRIMARY TRACK: DOCENCIA PÚBLICA · DECRETO 1278</span>
            </footer>
          </div>
        </main>
      </div>

      <CommandMenu
        open={isCommandMenuOpen}
        onOpenChange={handleCommandMenuChange}
        items={commandItems}
        label="DREYK / LIFE PLAN COMMAND"
        placeholder="Jump to section or workspace…"
      />
    </div>
  );
}
