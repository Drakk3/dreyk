'use client';

import { Badge } from '@/components/thegridcn/badge';
import { DataCard } from '@/components/thegridcn/data-card';
import { Select } from '@/components/thegridcn/select';

import { formatLifePlanCurrency } from '../services/lifePlanCurrency';
import type {
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
}

interface MetricRowProps {
  label: string;
  value: string;
}

interface GoalCardProps {
  description: string;
  title: string;
}

function formatCurrency(value: number): string {
  return formatLifePlanCurrency(value, 'USD');
}

function resolveHorizon(value: string, horizonOptions: PlanningHorizonMonths[]): PlanningHorizonMonths | null {
  const parsedValue = Number(value);
  const matchedHorizon = horizonOptions.find((option) => option === parsedValue);

  return matchedHorizon ?? null;
}

function MetricRow({ label, value }: MetricRowProps): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
      <span>{label}</span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  );
}

function GoalCard({ description, title }: GoalCardProps): JSX.Element {
  return (
    <div className="rounded border border-primary/20 bg-background/40 p-3">
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export function FinancialProjectionCard({
  debtTimeline,
  handleHorizonChange,
  horizonOptions,
  operatingOverview,
  selectedHorizonMonths,
}: FinancialProjectionCardProps): JSX.Element {
  const currentWeek = operatingOverview.currentWeek;
  const totals = operatingOverview.totals;
  const overviewDateContext = operatingOverview.dateContext;

  return (
    <DataCard
      subtitle="OVERVIEW"
      title="Protocolo Colombia"
      headerRight={
        <Badge variant={overviewDateContext.isCurrentMonthAvailable ? 'default' : 'outline'}>
          {overviewDateContext.overviewMonthLabel}
        </Badge>
      }
    >
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{overviewDateContext.overviewWeekLabel}</Badge>
            <Badge variant="outline">{overviewDateContext.freshnessLabel}</Badge>
          </div>
          <div className="w-full max-w-[220px]">
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
          </div>
        </div>

        <div className="rounded border border-primary/25 bg-primary/5 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">{operatingOverview.protocoloColombia.badgeLabel}</Badge>
            <Badge variant="outline">{operatingOverview.copContext.locationLabel}</Badge>
          </div>
          <h3 className="mt-3 text-base font-semibold text-foreground">{operatingOverview.protocoloColombia.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            This life plan is the operating system for Protocolo Colombia. Every payment, expense, and debt decision is evaluated against the same end state: zero debt, a teaching position in Cumaral or nearby, access to a mortgage, and 15,000 USD of free savings by 2029.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <GoalCard
              title="0 debt"
              description="Remove active debt pressure and protect payoff momentum month by month."
            />
            <GoalCard
              title="Teaching role in Cumaral"
              description="Land a docente position in Cumaral or the surrounding area."
            />
            <GoalCard
              title="Mortgage readiness"
              description="Build the stability required to qualify for a home purchase."
            />
            <GoalCard
              title="15k free savings by 2029"
              description="Reach 15,000 USD in unrestricted savings by the 2029 target."
            />
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-3">
          <div className="rounded border border-border/60 bg-background/30 p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Current week</div>
            <div className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-foreground">{currentWeek.label}</div>
            <div className="mt-3 space-y-2">
              <MetricRow label="Inflow" value={formatCurrency(currentWeek.totalInflowUsd)} />
              <MetricRow label="Outflow" value={formatCurrency(currentWeek.totalOutflowUsd)} />
              <MetricRow label="Debt paid" value={formatCurrency(currentWeek.debtPaymentUsd)} />
              <MetricRow label="Ending" value={formatCurrency(currentWeek.endingBalanceUsd)} />
            </div>
          </div>

          <div className="rounded border border-border/60 bg-background/30 p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Execution now</div>
            <div className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-foreground">
              {currentWeek.doneEntryCount} done · {currentWeek.plannedEntryCount} pending
            </div>
            <div className="mt-3 space-y-2">
              <MetricRow label="Pending items" value={String(operatingOverview.pendingWeekItems.length)} />
              <MetricRow label="Skipped" value={String(currentWeek.skippedEntryCount)} />
              <MetricRow label="Free margin" value={formatCurrency(currentWeek.freeMarginUsd)} />
              <MetricRow label="Safe extra" value={formatCurrency(totals.safeExtraPaymentUsd)} />
            </div>
          </div>

          <div className="rounded border border-border/60 bg-background/30 p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Outlook</div>
            <div className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-foreground">{selectedHorizonMonths} month view</div>
            <div className="mt-3 space-y-2">
              <MetricRow label="Month income" value={formatCurrency(totals.totalIncomeUsd)} />
              <MetricRow label="Month outflow" value={formatCurrency(totals.totalOutflowUsd)} />
              <MetricRow label="Net" value={formatCurrency(totals.netUsd)} />
              <MetricRow label="Payoff line" value={operatingOverview.payoffSummary.progressLabel} />
            </div>
          </div>
        </div>

        <div className="rounded border border-border/60 bg-background/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Current-week queue</div>
            </div>
            <Badge variant="outline">{operatingOverview.pendingWeekItems.length} pending</Badge>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {operatingOverview.pendingWeekItems.length > 0 ? (
              operatingOverview.pendingWeekItems.map((item) => (
                <div key={item.id} className="rounded border border-border/60 bg-card/60 p-3">
                  <div className="text-sm font-medium text-foreground">{item.label}</div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{item.scheduledDateLabel}</span>
                    <span>{formatCurrency(item.amountUsd)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded border border-dashed border-border/60 bg-card/30 p-3 text-sm text-muted-foreground">
                Nothing pending in the current week. Fantastic — the overview is caught up.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Debt cards</div>
          </div>

          <div className="grid gap-2 xl:grid-cols-2 2xl:grid-cols-3">
            {operatingOverview.debtCards.map((debtCard) => (
              <div key={debtCard.id} className="rounded border border-border/60 bg-background/30 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">{debtCard.name}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{debtCard.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Amount</div>
                    <div className="mt-1 text-base font-semibold text-foreground">{formatCurrency(debtCard.amountUsd)}</div>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">APR</div>
                    <div className="mt-1 text-xs text-foreground">{debtCard.aprLabel}</div>
                    {debtCard.aprContextLabel !== undefined ? (
                      <p className="mt-1 text-xs text-muted-foreground">{debtCard.aprContextLabel}</p>
                    ) : null}
                  </div>

                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Recurring pay</div>
                    <div className="mt-1 text-xs text-foreground">{formatCurrency(debtCard.recurringPay.amountUsd)}</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {debtCard.recurringPay.label} · {debtCard.recurringPay.scheduledDateLabel}
                    </p>
                  </div>

                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Payoff</div>
                    <div className="mt-1 text-xs text-foreground">{debtCard.payoffLabel}</div>
                    {debtCard.projectedPayoffLabel !== undefined ? (
                      <p className="mt-1 text-xs text-muted-foreground">{debtCard.projectedPayoffLabel}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-border/60 bg-background/30 p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Payoff highlights</div>
          <p className="mt-2 text-sm text-muted-foreground">
            {debtTimeline.monthsToDebtFree === null
              ? `At the current pace, the debt plan extends beyond ${selectedHorizonMonths} months.`
              : `At the current pace, the core debt line reaches zero in ${debtTimeline.monthsToDebtFree} months.`}
          </p>

          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {debtTimeline.steps.slice(0, 4).map((step) => (
              <div key={step.monthIndex} className="rounded border border-border/60 bg-card/60 p-3">
                <div className="text-sm font-semibold text-foreground">{step.monthLabel}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Focus: {step.focusDebtName ?? 'No active payoff target'}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">Applied {formatCurrency(step.totalBudgetAppliedUsd)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Left {formatCurrency(step.remainingBudgetUsd)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DataCard>
  );
}
