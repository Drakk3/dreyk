'use client';

import * as React from 'react';

import { Badge } from '@/components/thegridcn/badge';
import { DataCard } from '@/components/thegridcn/data-card';
import { DataTable } from '@/components/thegridcn/data-table';
import { Select } from '@/components/thegridcn/select';
import { TabPanel, Tabs } from '@/components/thegridcn/tabs';
import { Tooltip } from '@/components/thegridcn/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';

import { formatLifePlanCurrency } from '../services/lifePlanCurrency';
import type {
  OperatingDebtListItem,
  OperatingDebtTimelineSummary,
  OperatingOverviewModel,
  PlanningHorizonMonths,
} from '../types';

interface FinancialProjectionCardProps {
  debtTimeline: OperatingDebtTimelineSummary;
  handleHorizonChange: (value: PlanningHorizonMonths) => void;
  horizonOptions: PlanningHorizonMonths[];
  operatingOverview: OperatingOverviewModel;
  selectedHorizonMonths: PlanningHorizonMonths;
  selectedMonthLabel: string;
}

interface DebtTableRow extends Record<string, unknown> {
  aprLabel: string;
  balanceUsd: number;
  debtName: string;
  minimumPaymentUsd: number;
  payoffLineLabel: string;
  plannedPaymentUsd: number;
  statusLabel: string;
}

function formatCurrency(value: number): string {
  return formatLifePlanCurrency(value, 'USD');
}

function buildDebtRows(debts: OperatingDebtListItem[]): DebtTableRow[] {
  return debts.map((debt) => ({
    aprLabel: `${(debt.apr * 100).toFixed(1)}%`,
    balanceUsd: debt.balanceUsd,
    debtName: `${debt.creditor} · ${debt.label}`,
    minimumPaymentUsd: debt.minimumPaymentUsd,
    payoffLineLabel: debt.payoffLineLabel,
    plannedPaymentUsd: debt.plannedPaymentUsd,
    statusLabel: debt.isExcludedFromPayoffLine ? 'Context only' : 'Core target',
  }));
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
  debtTimeline,
  handleHorizonChange,
  horizonOptions,
  operatingOverview,
  selectedHorizonMonths,
  selectedMonthLabel,
}: FinancialProjectionCardProps): JSX.Element {
  const [activeTab, setActiveTab] = React.useState<string>('projection');
  const debtRows = React.useMemo(() => buildDebtRows(operatingOverview.debtList), [operatingOverview.debtList]);
  const currentWeek = operatingOverview.currentWeek;
  const totals = operatingOverview.totals;

  return (
    <DataCard
      subtitle="OVERVIEW · OPERATING MODEL"
      title="Current-week cash + payoff line"
      headerRight={<Badge variant="default">{selectedMonthLabel}</Badge>}
    >
      <div className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_auto]">
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
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Safe extra payment</div>
            <div className="mt-2 text-lg font-semibold text-foreground">
              {formatCurrency(totals.safeExtraPaymentUsd)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Extra operativo seguro sin romper balances semanales futuros.</p>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-3">
          <div className="rounded border border-border/60 bg-background/30 p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Current week</div>
            <div className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-foreground">{currentWeek.label}</div>
            <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between gap-2"><span>Starting</span><span>{formatCurrency(currentWeek.startingBalanceUsd)}</span></div>
              <div className="flex items-center justify-between gap-2"><span>Inflow</span><span>{formatCurrency(currentWeek.totalInflowUsd)}</span></div>
              <div className="flex items-center justify-between gap-2"><span>Outflow</span><span>{formatCurrency(currentWeek.totalOutflowUsd)}</span></div>
              <div className="flex items-center justify-between gap-2 text-primary"><span>Ending</span><span>{formatCurrency(currentWeek.endingBalanceUsd)}</span></div>
            </div>
          </div>

          <div className="rounded border border-border/60 bg-background/30 p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">USD operating totals</div>
            <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between gap-2"><span>Total income</span><span>{formatCurrency(totals.totalIncomeUsd)}</span></div>
              <div className="flex items-center justify-between gap-2"><span>Total outflow</span><span>{formatCurrency(totals.totalOutflowUsd)}</span></div>
              <div className="flex items-center justify-between gap-2"><span>Debt payments</span><span>{formatCurrency(totals.debtPaymentUsd)}</span></div>
              <div className="flex items-center justify-between gap-2"><span>Non-debt expenses</span><span>{formatCurrency(totals.nonDebtExpenseUsd)}</span></div>
              <div className="flex items-center justify-between gap-2 text-primary"><span>Net month</span><span>{formatCurrency(totals.netUsd)}</span></div>
            </div>
          </div>

          <div className="rounded border border-border/60 bg-background/30 p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Colombia context</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline">{operatingOverview.copContext.locationLabel}</Badge>
              <Badge variant="outline">{operatingOverview.copContext.operationalCurrencyLabel}</Badge>
              <Badge variant="outline">{operatingOverview.copContext.teacherSalaryContextLabel}</Badge>
            </div>
            <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between gap-2"><span>Core debt</span><span>{formatCurrency(totals.coreDebtBalanceUsd)}</span></div>
              <div className="flex items-center justify-between gap-2"><span>Mazda/context debt</span><span>{formatCurrency(totals.excludedDebtBalanceUsd)}</span></div>
              <div className="flex items-center justify-between gap-2"><span>This week debt</span><span>{formatCurrency(currentWeek.debtPaymentUsd)}</span></div>
              <div className="flex items-center justify-between gap-2"><span>Status mix</span><span>{currentWeek.doneEntryCount} done · {currentWeek.plannedEntryCount} planned</span></div>
            </div>
          </div>
        </div>

        <Tabs
          tabs={[
            { label: 'Overview', value: 'projection' },
            { label: 'Payoff line', value: 'cascade' },
          ]}
          value={activeTab}
          onChange={setActiveTab}
          variant="underline"
        >
          <TabPanel value="projection" activeValue={activeTab} className="space-y-4">
            <div className="space-y-4 rounded border border-border/60 bg-background/30 p-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Payoff status</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {debtTimeline.monthsToDebtFree === null
                      ? 'Core debt does not clear within the selected horizon.'
                      : `Core debt clears in ${debtTimeline.monthsToDebtFree} months.`}
                  </p>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Core remaining</div>
                  <p className="mt-1 text-sm text-muted-foreground">{formatCurrency(debtTimeline.remainingCoreDebtBalanceUsd)}</p>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Mazda excluded</div>
                  <p className="mt-1 text-sm text-muted-foreground">{formatCurrency(debtTimeline.remainingExcludedDebtBalanceUsd)}</p>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Base debt budget</div>
                  <p className="mt-1 text-sm text-muted-foreground">{formatCurrency(debtTimeline.monthlyBaseDebtBudgetUsd)}</p>
                </div>
              </div>

              <Separator className="bg-border/60" />

              <p className="text-sm text-muted-foreground">{debtTimeline.assumptionLabel}</p>
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
                    <Tooltip content={String(row.payoffLineLabel)}>
                      <button type="button" className="text-left text-primary underline-offset-4 hover:underline">
                        {resolveDebtName(value)}
                      </button>
                    </Tooltip>
                  ),
                },
                {
                  key: 'balanceUsd',
                  label: 'Balance',
                  sortable: true,
                  align: 'right',
                  render: (value: unknown) => formatCurrency(resolveCurrencyValue(value)),
                },
                {
                  key: 'minimumPaymentUsd',
                  label: 'Min payment',
                  align: 'right',
                  render: (value: unknown) => formatCurrency(resolveCurrencyValue(value)),
                },
                {
                  key: 'plannedPaymentUsd',
                  label: 'Planned',
                  align: 'right',
                  render: (value: unknown) => formatCurrency(resolveCurrencyValue(value)),
                },
                {
                  key: 'aprLabel',
                  label: 'APR',
                  align: 'right',
                },
                {
                  key: 'statusLabel',
                  label: 'Scope',
                },
              ]}
            />

            <Accordion type="single" collapsible className="rounded border border-border/60 bg-background/30 px-4">
              {debtTimeline.steps.map((step) => (
                <AccordionItem key={step.monthIndex} value={`month-${step.monthIndex}`}>
                  <AccordionTrigger className="font-mono text-xs uppercase tracking-[0.18em]">
                    {step.monthLabel} · foco {step.focusDebtName ?? 'sin deuda core activa'} · aplicado{' '}
                    {formatCurrency(step.totalBudgetAppliedUsd)}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {step.allocations.map((allocation) => (
                        <div key={allocation.debtId} className="rounded border border-border/60 bg-card/60 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/40">
                              {allocation.debtName}
                            </span>
                            <Badge variant={allocation.isCleared ? 'success' : allocation.isExcludedFromPayoffLine ? 'outline' : 'default'}>
                              {allocation.isCleared ? 'Cleared' : allocation.isExcludedFromPayoffLine ? 'Context only' : 'Core'}
                            </Badge>
                          </div>
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            <div>Inicio: {formatCurrency(allocation.startingBalanceUsd)}</div>
                            <div>Interés: {formatCurrency(allocation.interestAccruedUsd)}</div>
                            <div>Base: {formatCurrency(allocation.scheduledPaymentAppliedUsd)}</div>
                            <div>Extra: {formatCurrency(allocation.extraPaymentAppliedUsd)}</div>
                            <div>Final: {formatCurrency(allocation.endingBalanceUsd)}</div>
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
