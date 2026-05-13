'use client';

import * as React from 'react';

import { Badge } from '@/components/thegridcn/badge';
import { DataCard } from '@/components/thegridcn/data-card';
import { DataTable } from '@/components/thegridcn/data-table';
import { ProgressBar } from '@/components/thegridcn/progress-bar';
import { ProgressRing } from '@/components/thegridcn/progress-ring';
import { Select } from '@/components/thegridcn/select';
import { TabPanel, Tabs } from '@/components/thegridcn/tabs';
import { Tooltip } from '@/components/thegridcn/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';

import type { DebtItem, FinancialProjection, FinancialScenario, PlanningHorizonMonths, PlanningScenarioId } from '../types';

interface FinancialProjectionCardProps {
  debts: DebtItem[];
  financialProjection: FinancialProjection;
  handleHorizonChange: (value: PlanningHorizonMonths) => void;
  handleScenarioChange: (value: PlanningScenarioId) => void;
  horizonOptions: PlanningHorizonMonths[];
  scenarios: FinancialScenario[];
  selectedHorizonMonths: PlanningHorizonMonths;
  selectedScenario: FinancialScenario;
  selectedScenarioId: PlanningScenarioId;
}

interface DebtTableRow extends Record<string, unknown> {
  aprLabel: string;
  balance: number;
  debtName: string;
  minimumPayment: number;
  notes: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    currency: 'COP',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}

function buildDebtRows(debts: DebtItem[]): DebtTableRow[] {
  return debts.map((debt) => ({
    aprLabel: `${(debt.apr * 100).toFixed(1)}%`,
    balance: debt.balance,
    debtName: debt.name,
    minimumPayment: debt.minPayment,
    notes: debt.notes,
  }));
}

function resolveScenarioId(value: string, scenarios: FinancialScenario[]): PlanningScenarioId | null {
  const matchedScenario = scenarios.find((scenario) => scenario.id === value);

  return matchedScenario?.id ?? null;
}

function resolveHorizon(value: string, horizonOptions: PlanningHorizonMonths[]): PlanningHorizonMonths | null {
  const parsedValue = Number(value);
  const matchedHorizon = horizonOptions.find((option) => option === parsedValue);

  return matchedHorizon ?? null;
}

function resolveDebtName(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function resolveCurrencyValue(value: unknown): number {
  return typeof value === 'number' ? value : 0;
}

export function FinancialProjectionCard({
  debts,
  financialProjection,
  handleHorizonChange,
  handleScenarioChange,
  horizonOptions,
  scenarios,
  selectedHorizonMonths,
  selectedScenario,
  selectedScenarioId,
}: FinancialProjectionCardProps): JSX.Element {
  const [activeTab, setActiveTab] = React.useState<string>('projection');
  const debtRows = React.useMemo(() => buildDebtRows(debts), [debts]);
  const reserveProgress = Math.round(financialProjection.emergencyProgressRatio * 100);
  const minimumPaymentFloor = Math.max(financialProjection.debtCascade.totalMinimumPayment, 1);
  const budgetCoverage = Math.round(
    (financialProjection.resolvedCashFlow.debtBudget / minimumPaymentFloor) * 100,
  );

  return (
    <DataCard
      subtitle="FINANCE · MVP MODEL"
      title="Financial projection"
      headerRight={<Badge variant="default">{selectedScenario.label}</Badge>}
    >
      <div className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
          <Select
            label="Scenario"
            value={selectedScenarioId}
            options={scenarios.map((scenario) => ({ label: scenario.label, value: scenario.id }))}
            onChange={(value: string) => {
              const nextScenarioId = resolveScenarioId(value, scenarios);

              if (nextScenarioId !== null) {
                handleScenarioChange(nextScenarioId);
              }
            }}
          />
          <Select
            label="Horizon"
            value={String(selectedHorizonMonths)}
            options={horizonOptions.map((option) => ({ label: `${option} meses`, value: String(option) }))}
            onChange={(value: string) => {
              const nextHorizon = resolveHorizon(value, horizonOptions);

              if (nextHorizon !== null) {
                handleHorizonChange(nextHorizon);
              }
            }}
          />
          <div className="rounded border border-border/60 bg-background/40 p-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Monthly goal surplus</div>
            <div className="mt-2 text-lg font-semibold text-foreground">
              {formatCurrency(financialProjection.monthlyGoalSurplus)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Caja disponible después de asignar deuda mensual.</p>
          </div>
        </div>

        <Tabs
          tabs={[
            { label: 'Projection', value: 'projection' },
            { label: 'Debt cascade', value: 'cascade' },
          ]}
          value={activeTab}
          onChange={setActiveTab}
          variant="underline"
        >
          <TabPanel value="projection" activeValue={activeTab} className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[220px_1fr]">
              <div className="flex items-center justify-center rounded border border-border/60 bg-background/30 p-4">
                <ProgressRing
                  value={reserveProgress}
                  label="Emergency reserve"
                  size="md"
                  variant={reserveProgress >= 70 ? 'success' : 'warning'}
                />
              </div>

              <div className="space-y-4 rounded border border-border/60 bg-background/30 p-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
                      Reserve target
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                      {formatCurrency(financialProjection.resolvedCashFlow.currentEmergencyReserve)} /{' '}
                      {formatCurrency(financialProjection.resolvedCashFlow.emergencyTarget)}
                    </span>
                  </div>
                  <ProgressBar value={reserveProgress} variant={reserveProgress >= 70 ? 'success' : 'warning'} showValue />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
                      Debt budget coverage
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                      {formatCurrency(financialProjection.resolvedCashFlow.debtBudget)}
                    </span>
                  </div>
                  <ProgressBar value={budgetCoverage} variant="default" showValue striped />
                </div>

                <Separator className="bg-border/60" />

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Scenario note</div>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedScenario.description}</p>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Debt-free estimate</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {financialProjection.debtCascade.monthsToDebtFree === null
                        ? 'Todavía no liquida toda la deuda dentro del horizonte seleccionado.'
                        : `La proyección liquida la deuda en ${financialProjection.debtCascade.monthsToDebtFree} meses.`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel value="cascade" activeValue={activeTab} className="space-y-4">
            <DataTable<DebtTableRow>
              label="Debt portfolio"
              data={debtRows}
              columns={[
                {
                  key: 'debtName',
                  label: 'Debt',
                  render: (value: unknown, row: DebtTableRow) => (
                    <Tooltip content={String(row.notes)}>
                      <button type="button" className="text-left text-primary underline-offset-4 hover:underline">
                        {resolveDebtName(value)}
                      </button>
                    </Tooltip>
                  ),
                },
                {
                  key: 'balance',
                  label: 'Balance',
                  sortable: true,
                  align: 'right',
                  render: (value: unknown) => formatCurrency(resolveCurrencyValue(value)),
                },
                {
                  key: 'minimumPayment',
                  label: 'Min payment',
                  align: 'right',
                  render: (value: unknown) => formatCurrency(resolveCurrencyValue(value)),
                },
                {
                  key: 'aprLabel',
                  label: 'APR',
                  align: 'right',
                },
              ]}
            />

            <Accordion type="single" collapsible className="rounded border border-border/60 bg-background/30 px-4">
              {financialProjection.debtCascade.steps.map((step) => (
                <AccordionItem key={step.monthIndex} value={`month-${step.monthIndex}`}>
                  <AccordionTrigger className="font-mono text-xs uppercase tracking-[0.18em]">
                    Mes {step.monthIndex} · foco {step.focusDebtName ?? 'sin deuda activa'} · aplicado{' '}
                    {formatCurrency(step.totalBudgetApplied)}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {step.allocations.map((allocation) => (
                        <div key={allocation.debtId} className="rounded border border-border/60 bg-card/60 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/40">
                              {allocation.debtName}
                            </span>
                            <Badge variant={allocation.isCleared ? 'success' : 'outline'}>
                              {allocation.isCleared ? 'Cleared' : 'Open'}
                            </Badge>
                          </div>
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            <div>Inicio: {formatCurrency(allocation.startingBalance)}</div>
                            <div>Interés: {formatCurrency(allocation.interestAccrued)}</div>
                            <div>Mínimo: {formatCurrency(allocation.minimumPaymentApplied)}</div>
                            <div>Extra: {formatCurrency(allocation.extraPaymentApplied)}</div>
                            <div>Final: {formatCurrency(allocation.endingBalance)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabPanel>
        </Tabs>
      </div>
    </DataCard>
  );
}
