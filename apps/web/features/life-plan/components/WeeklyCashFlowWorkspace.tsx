'use client';

import * as React from 'react';

import { Badge } from '@/components/thegridcn/badge';
import { DataCard } from '@/components/thegridcn/data-card';
import { DataTable } from '@/components/thegridcn/data-table';

import { formatLifePlanCurrency } from '../services/lifePlanCurrency';
import type {
  CashFlowWorkspaceWeek,
  FinancialDataConfidence,
  ReviewQueueItem,
  SafeExtraPaymentSummary,
  WeeklyCashFlowWorkspace as WeeklyCashFlowWorkspaceModel,
} from '../types';

interface WeeklyCashFlowWorkspaceProps {
  workspace: WeeklyCashFlowWorkspaceModel;
}

interface WeekRow extends Record<string, unknown> {
  endingBalance: number;
  freeMargin: number;
  label: string;
  reviewSummary: string;
  startingBalance: number;
  totalInflow: number;
  totalOutflow: number;
}

interface ReviewRow extends Record<string, unknown> {
  amountLabel: string;
  confidence: FinancialDataConfidence;
  label: string;
  reason: string;
  sourceLabel: string;
  weekLabel: string;
}

function getConfidenceBadgeVariant(confidence: FinancialDataConfidence): 'danger' | 'success' | 'warning' {
  if (confidence === 'needsReview') {
    return 'danger';
  }

  if (confidence === 'estimated') {
    return 'warning';
  }

  return 'success';
}

function isFinancialDataConfidence(value: unknown): value is FinancialDataConfidence {
  return value === 'verified' || value === 'estimated' || value === 'needsReview';
}

function buildWeekRows(workspace: WeeklyCashFlowWorkspaceModel): WeekRow[] {
  return workspace.weeks.map((week) => ({
    endingBalance: week.endingBalance,
    freeMargin: week.freeMargin,
    label: week.label,
    reviewSummary: `${week.reviewItemCount} review · ${week.estimatedItemCount} estimated · ${week.eventCount} events`,
    startingBalance: week.startingBalance,
    totalInflow: week.totalInflow,
    totalOutflow: week.totalOutflow,
  }));
}

function buildReviewRows(reviewQueue: ReviewQueueItem[]): ReviewRow[] {
  return reviewQueue.map((item) => ({
    amountLabel:
      item.amount === undefined ? '—' : formatLifePlanCurrency(item.amount, item.currencyCode),
    confidence: item.confidence,
    label: item.label,
    reason: item.reason,
    sourceLabel: item.sourceLabel,
    weekLabel: item.weekStartDate ?? 'Snapshot-wide',
  }));
}

function renderConfidenceBadge(confidence: FinancialDataConfidence): JSX.Element {
  return (
    <Badge variant={getConfidenceBadgeVariant(confidence)} dot>
      {confidence}
    </Badge>
  );
}

function renderSafeExtraCard(summary: SafeExtraPaymentSummary): JSX.Element {
  return (
    <DataCard
      subtitle="SAFE EXTRA PAYMENT"
      title="Conservative recommendation"
      headerRight={renderConfidenceBadge(summary.confidence)}
    >
      <div className="space-y-4 p-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Safe now</div>
          <div className="mt-2 text-2xl font-semibold text-primary">
            {formatLifePlanCurrency(summary.amount, summary.currencyCode)}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{summary.explanation}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded border border-border/60 bg-background/30 p-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Lowest future ending balance</div>
            <div className="mt-2 text-sm font-semibold text-foreground">
              {formatLifePlanCurrency(summary.minimumFutureEndingBalance, summary.currencyCode)}
            </div>
          </div>
          <div className="rounded border border-border/60 bg-background/30 p-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Based on week</div>
            <div className="mt-2 text-sm font-semibold text-foreground">{summary.basedOnWeekStartDate}</div>
          </div>
        </div>

        {summary.blockingReasons.length > 0 ? (
          <div className="rounded border border-red-500/30 bg-red-500/5 p-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-red-400">Blocking reasons</div>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {summary.blockingReasons.map((reason) => (
                <li key={reason}>• {reason}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </DataCard>
  );
}

function renderWeekDetails(weeks: CashFlowWorkspaceWeek[], currencyCode: WeeklyCashFlowWorkspaceModel['currencyCode']): JSX.Element {
  return (
    <div className="space-y-4">
      {weeks.map((week) => (
        <DataCard
          key={week.id}
          subtitle="WEEK DETAIL"
          title={week.label}
          headerRight={
            week.reviewItemCount > 0 ? <Badge variant="warning">{week.reviewItemCount} review items</Badge> : undefined
          }
        >
          <div className="space-y-3 p-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Starting</div>
                <div className="mt-1 text-sm font-semibold text-foreground">
                  {formatLifePlanCurrency(week.startingBalance, currencyCode)}
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Inflow</div>
                <div className="mt-1 text-sm font-semibold text-emerald-400">
                  {formatLifePlanCurrency(week.totalInflow, currencyCode)}
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Outflow</div>
                <div className="mt-1 text-sm font-semibold text-red-400">
                  {formatLifePlanCurrency(week.totalOutflow, currencyCode)}
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Ending balance</div>
                <div className="mt-1 text-sm font-semibold text-primary">
                  {formatLifePlanCurrency(week.endingBalance, currencyCode)}
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded border border-border/60 bg-background/20 p-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Scheduled events</div>
              <div className="space-y-2">
                {week.events.map((event) => (
                  <div key={event.id} className="flex flex-col gap-2 rounded border border-border/50 bg-background/30 p-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{event.label}</span>
                        {renderConfidenceBadge(event.confidence)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {event.date} · {event.sourceLabel}
                      </div>
                      {event.notes !== undefined ? <p className="mt-1 text-xs text-muted-foreground">{event.notes}</p> : null}
                    </div>
                    <div className="text-right text-sm font-semibold text-foreground">
                      {event.direction === 'inflow' ? '+' : '-'}
                      {formatLifePlanCurrency(event.amount, event.currencyCode)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DataCard>
      ))}
    </div>
  );
}

export function WeeklyCashFlowWorkspace({ workspace }: WeeklyCashFlowWorkspaceProps): JSX.Element {
  const weekRows = React.useMemo(() => buildWeekRows(workspace), [workspace]);
  const reviewRows = React.useMemo(() => buildReviewRows(workspace.reviewQueue), [workspace.reviewQueue]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <DataCard subtitle="REAL-DATA WORKSPACE" title="Weekly cash-flow board" headerRight={<Badge variant="default">USD default</Badge>}>
          <div className="grid gap-3 p-4 md:grid-cols-4">
            <div className="rounded border border-border/60 bg-background/30 p-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Free margin</div>
              <div className="mt-2 text-lg font-semibold text-primary">
                {formatLifePlanCurrency(workspace.summary.freeMargin, workspace.summary.currencyCode)}
              </div>
            </div>
            <div className="rounded border border-border/60 bg-background/30 p-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Total inflow</div>
              <div className="mt-2 text-lg font-semibold text-emerald-400">
                {formatLifePlanCurrency(workspace.summary.totalInflow, workspace.summary.currencyCode)}
              </div>
            </div>
            <div className="rounded border border-border/60 bg-background/30 p-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Total outflow</div>
              <div className="mt-2 text-lg font-semibold text-red-400">
                {formatLifePlanCurrency(workspace.summary.totalOutflow, workspace.summary.currencyCode)}
              </div>
            </div>
            <div className="rounded border border-border/60 bg-background/30 p-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Review queue</div>
              <div className="mt-2 text-lg font-semibold text-foreground">{workspace.summary.reviewItemCount}</div>
            </div>
          </div>
        </DataCard>

        {renderSafeExtraCard(workspace.safeExtraPayment)}
      </div>

      <DataTable<WeekRow>
        label="Weekly checkpoints"
        data={weekRows}
        columns={[
          { key: 'label', label: 'Week' },
          {
            key: 'startingBalance',
            label: 'Starting',
            align: 'right',
            render: (value: unknown) =>
              typeof value === 'number' ? formatLifePlanCurrency(value, workspace.summary.currencyCode) : '—',
          },
          {
            key: 'totalInflow',
            label: 'Inflow',
            align: 'right',
            render: (value: unknown) =>
              typeof value === 'number' ? formatLifePlanCurrency(value, workspace.summary.currencyCode) : '—',
          },
          {
            key: 'totalOutflow',
            label: 'Outflow',
            align: 'right',
            render: (value: unknown) =>
              typeof value === 'number' ? formatLifePlanCurrency(value, workspace.summary.currencyCode) : '—',
          },
          {
            key: 'freeMargin',
            label: 'Free margin',
            align: 'right',
            render: (value: unknown) =>
              typeof value === 'number' ? formatLifePlanCurrency(value, workspace.summary.currencyCode) : '—',
          },
          {
            key: 'endingBalance',
            label: 'Ending',
            align: 'right',
            render: (value: unknown) =>
              typeof value === 'number' ? formatLifePlanCurrency(value, workspace.summary.currencyCode) : '—',
          },
          { key: 'reviewSummary', label: 'Review state' },
        ]}
      />

      <DataTable<ReviewRow>
        label="Review queue"
        data={reviewRows}
        columns={[
          { key: 'label', label: 'Item' },
          {
            key: 'confidence',
            label: 'Confidence',
            render: (value: unknown) =>
              isFinancialDataConfidence(value) ? renderConfidenceBadge(value) : '—',
          },
          { key: 'weekLabel', label: 'Week' },
          { key: 'amountLabel', label: 'Amount', align: 'right' },
          { key: 'sourceLabel', label: 'Source' },
          { key: 'reason', label: 'Reason' },
        ]}
      />

      {renderWeekDetails(workspace.weeks, workspace.currencyCode)}
    </div>
  );
}
