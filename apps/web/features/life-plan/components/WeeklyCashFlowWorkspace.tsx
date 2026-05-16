'use client';

import * as React from 'react';

import { Badge } from '@/components/thegridcn/badge';
import { DataCard } from '@/components/thegridcn/data-card';
import { Select } from '@/components/thegridcn/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import type { OperatingMonthOption } from '../hooks/useLifePlanDashboard';
import type {
  CashFlowWorkspaceWeek,
  CashFlowWorkspaceWeekEvent,
  OperatingEntryStatus,
  OperatingMonth,
  OperatingRecurringQueueItem,
  WeeklyCashFlowWorkspace as WeeklyCashFlowWorkspaceModel,
} from '../types';
import type {
  CreateOperatingEntryInput,
  TransitionOperatingEntryStatusInput,
  UpdateOperatingEntryInput,
} from '../services/operatingEntryMutations';
import { formatLifePlanCurrency } from '../services/lifePlanCurrency';

interface WeeklyCashFlowWorkspaceProps {
  activeMonth: OperatingMonth;
  availableMonths: OperatingMonthOption[];
  onCreateEntry: (input: CreateOperatingEntryInput) => void;
  onDeleteEntry: (entryId: string) => void;
  onIncorporateRecurringQueueItem: (queueItemId: string) => void;
  onNavigateMonth: (offset: number) => void;
  onSelectMonth: (monthId: string) => void;
  onSelectWeek: (weekId: string | null) => void;
  onTransitionEntryStatus: (entryId: string, input: TransitionOperatingEntryStatusInput) => void;
  onUpdateEntry: (entryId: string, input: UpdateOperatingEntryInput) => void;
  selectedWeekId: string | null;
  workspace: WeeklyCashFlowWorkspaceModel;
}

interface EntryDraftState {
  amountUsd: string;
  category: CreateOperatingEntryInput['category'];
  confidence: CreateOperatingEntryInput['confidence'];
  date: string;
  kind: CreateOperatingEntryInput['kind'];
  label: string;
  notes: string;
}

function createEntryDraft(activeMonth: OperatingMonth): EntryDraftState {
  return {
    amountUsd: '',
    category: 'other',
    confidence: 'verified',
    date: activeMonth.weeks[0]?.startDate ?? `${activeMonth.month}-01`,
    kind: 'expense',
    label: '',
    notes: '',
  };
}

function buildEntryInput(
  draft: EntryDraftState,
  sourceLabel: string,
): CreateOperatingEntryInput | null {
  const amountUsd = Number(draft.amountUsd);

  if (draft.label.trim() === '' || draft.date === '' || Number.isNaN(amountUsd)) {
    return null;
  }

  return {
    amountUsd,
    category: draft.category,
    confidence: draft.confidence,
    date: draft.date,
    kind: draft.kind,
    label: draft.label.trim(),
    ...(draft.notes.trim() === '' ? {} : { notes: draft.notes.trim() }),
    source: {
      capturedOn: new Date().toISOString().slice(0, 10),
      kind: 'manual',
      label: sourceLabel,
    },
    sourceKind: 'manual',
    status: 'planned',
  };
}

function buildUpdateInput(draft: EntryDraftState): UpdateOperatingEntryInput | null {
  const amountUsd = Number(draft.amountUsd);

  if (draft.label.trim() === '' || draft.date === '' || Number.isNaN(amountUsd)) {
    return null;
  }

  return {
    amountUsd,
    category: draft.category,
    confidence: draft.confidence,
    date: draft.date,
    kind: draft.kind,
    label: draft.label.trim(),
    ...(draft.notes.trim() === '' ? {} : { notes: draft.notes.trim() }),
  };
}

function createDraftFromEvent(event: CashFlowWorkspaceWeekEvent): EntryDraftState {
  return {
    amountUsd: String(event.amount),
    category: event.category,
    confidence: event.confidence,
    date: event.date,
    kind: event.kind,
    label: event.label,
    notes: event.notes ?? '',
  };
}

function getStatusVariant(status: OperatingEntryStatus): 'default' | 'outline' | 'warning' {
  if (status === 'done') {
    return 'default';
  }

  if (status === 'skipped') {
    return 'warning';
  }

  return 'outline';
}

function getSelectedWeek(weeks: CashFlowWorkspaceWeek[], selectedWeekId: string | null): CashFlowWorkspaceWeek | null {
  if (selectedWeekId === null) {
    return weeks[0] ?? null;
  }

  return weeks.find((week) => week.id === selectedWeekId) ?? weeks[0] ?? null;
}

function getPendingQueueItems(queueItems: OperatingRecurringQueueItem[]): OperatingRecurringQueueItem[] {
  return queueItems.filter((queueItem) => queueItem.status === 'pending');
}

function getEntryCategoryLabel(category: CashFlowWorkspaceWeekEvent['category']): string {
  return ENTRY_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? category;
}

function getEntryConfidenceLabel(confidence: CashFlowWorkspaceWeekEvent['confidence']): string {
  return ENTRY_CONFIDENCE_OPTIONS.find((option) => option.value === confidence)?.label ?? confidence;
}

function renderSummaryValue(value: number, tone: 'danger' | 'neutral' | 'success'): string {
  if (tone === 'success') {
    return value > 0 ? 'text-emerald-400' : 'text-foreground';
  }

  if (tone === 'danger') {
    return value > 0 ? 'text-red-400' : 'text-foreground';
  }

  return 'text-primary';
}

export function WeeklyCashFlowWorkspace({
  activeMonth,
  availableMonths,
  onCreateEntry,
  onDeleteEntry,
  onIncorporateRecurringQueueItem,
  onNavigateMonth,
  onSelectMonth,
  onSelectWeek,
  onTransitionEntryStatus,
  onUpdateEntry,
  selectedWeekId,
  workspace,
}: WeeklyCashFlowWorkspaceProps): JSX.Element {
  const [draft, setDraft] = React.useState<EntryDraftState>(() => createEntryDraft(activeMonth));
  const [editingEntryId, setEditingEntryId] = React.useState<string | null>(null);
  const [editingDraft, setEditingDraft] = React.useState<EntryDraftState | null>(null);
  const selectedWeek = React.useMemo(() => getSelectedWeek(workspace.weeks, selectedWeekId), [selectedWeekId, workspace.weeks]);
  const pendingQueueItems = React.useMemo(() => getPendingQueueItems(activeMonth.recurringQueue), [activeMonth.recurringQueue]);

  React.useEffect(() => {
    setDraft(createEntryDraft(activeMonth));
    setEditingEntryId(null);
    setEditingDraft(null);
  }, [activeMonth]);

  const handleDraftChange = React.useCallback(<TKey extends keyof EntryDraftState>(key: TKey, value: EntryDraftState[TKey]): void => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [key]: value,
    }));
  }, []);

  const handleEditingDraftChange = React.useCallback(
    <TKey extends keyof EntryDraftState>(key: TKey, value: EntryDraftState[TKey]): void => {
      setEditingDraft((currentDraft) => {
        if (currentDraft === null) {
          return currentDraft;
        }

        return {
          ...currentDraft,
          [key]: value,
        };
      });
    },
    [],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <DataCard subtitle="OPERATING MONTH" title="Interactive cash-flow workspace" headerRight={<Badge variant="default">USD default</Badge>}>
          <div className="space-y-4 p-4">
            <div className="grid gap-3 md:grid-cols-[auto_1fr_auto] md:items-end">
              <Button type="button" variant="outline" onClick={() => onNavigateMonth(-1)}>
                ← Prev month
              </Button>
              <Select
                label="Month"
                options={availableMonths.map((month) => ({ label: month.label, value: month.id }))}
                value={activeMonth.id}
                onChange={onSelectMonth}
              />
              <Button type="button" variant="outline" onClick={() => onNavigateMonth(1)}>
                Next month →
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <SummaryTile
                label="Free margin"
                value={formatLifePlanCurrency(workspace.summary.freeMargin, workspace.summary.currencyCode)}
                valueClassName={renderSummaryValue(workspace.summary.freeMargin, 'neutral')}
              />
              <SummaryTile
                label="Inflow"
                value={formatLifePlanCurrency(workspace.summary.totalInflow, workspace.summary.currencyCode)}
                valueClassName={renderSummaryValue(workspace.summary.totalInflow, 'success')}
              />
              <SummaryTile
                label="Outflow"
                value={formatLifePlanCurrency(workspace.summary.totalOutflow, workspace.summary.currencyCode)}
                valueClassName={renderSummaryValue(workspace.summary.totalOutflow, 'danger')}
              />
              <SummaryTile label="Pending recurring" value={String(pendingQueueItems.length)} valueClassName="text-foreground" />
            </div>

            <div className="space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Weekly groups</div>
              <div className="flex flex-wrap gap-2">
                {workspace.weeks.map((week) => {
                  const isSelected = week.id === selectedWeek?.id;

                  return (
                    <button
                      key={week.id}
                      type="button"
                      onClick={() => onSelectWeek(week.id)}
                      className={`rounded border px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/60 bg-background/30 text-foreground/60 hover:border-primary/40 hover:text-foreground'
                      }`}
                    >
                      <div>{week.label}</div>
                      <div className="mt-1 text-[9px] text-foreground/40">
                        {formatLifePlanCurrency(week.freeMargin, workspace.currencyCode)} · {week.eventCount} entries
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </DataCard>

        <DataCard subtitle="RECURRING QUEUE" title="Generated items waiting for incorporation" headerRight={<Badge variant="outline">{pendingQueueItems.length} pending</Badge>}>
          <div className="space-y-3 p-4">
            {activeMonth.recurringQueue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recurring items exist for this month.</p>
            ) : (
              activeMonth.recurringQueue.map((queueItem) => {
                const isPending = queueItem.status === 'pending';

                return (
                  <div key={queueItem.id} className="rounded border border-border/60 bg-background/30 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-foreground">{queueItem.label}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {queueItem.scheduledDate} · {formatLifePlanCurrency(queueItem.amountUsd, 'USD')} · {queueItem.cadence}
                        </div>
                      </div>
                      <Badge variant={isPending ? 'warning' : 'success'}>{queueItem.status}</Badge>
                    </div>
                    {queueItem.notes !== undefined ? <p className="mt-2 text-xs text-muted-foreground">{queueItem.notes}</p> : null}
                    {isPending ? (
                      <Button className="mt-3" type="button" size="sm" onClick={() => onIncorporateRecurringQueueItem(queueItem.id)}>
                        Incorporate into month
                      </Button>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </DataCard>
      </div>

      <DataCard subtitle="MANUAL ENTRY" title="Add cash-flow item">
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-6">
          <Input value={draft.label} placeholder="Label" onChange={(event) => handleDraftChange('label', event.currentTarget.value)} />
          <Input value={draft.date} type="date" onChange={(event) => handleDraftChange('date', event.currentTarget.value)} />
          <Input value={draft.amountUsd} type="number" step="0.01" placeholder="Amount USD" onChange={(event) => handleDraftChange('amountUsd', event.currentTarget.value)} />
          <Select
            options={ENTRY_KIND_OPTIONS}
            value={draft.kind}
            onChange={(value) => {
              if (isEntryKind(value)) {
                handleDraftChange('kind', value);
              }
            }}
          />
          <Select
            options={ENTRY_CATEGORY_OPTIONS}
            value={draft.category}
            onChange={(value) => {
              if (isEntryCategory(value)) {
                handleDraftChange('category', value);
              }
            }}
          />
          <Select
            options={ENTRY_CONFIDENCE_OPTIONS}
            value={draft.confidence}
            onChange={(value) => {
              if (isEntryConfidence(value)) {
                handleDraftChange('confidence', value);
              }
            }}
          />
          <div className="md:col-span-2 xl:col-span-5">
            <Input value={draft.notes} placeholder="Notes (optional)" onChange={(event) => handleDraftChange('notes', event.currentTarget.value)} />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                const entryInput = buildEntryInput(draft, 'Life plan manual entry');

                if (entryInput !== null) {
                  onCreateEntry(entryInput);
                  setDraft(createEntryDraft(activeMonth));
                }
              }}
            >
              Add entry
            </Button>
          </div>
        </div>
      </DataCard>

      {selectedWeek === null ? null : (
        <DataCard
          subtitle="WEEK DETAIL"
          title={selectedWeek.label}
          headerRight={selectedWeek.reviewItemCount > 0 ? <Badge variant="warning">{selectedWeek.reviewItemCount} review</Badge> : undefined}
        >
          <div className="space-y-4 p-4">
            <div className="grid gap-3 md:grid-cols-4">
              <SummaryTile label="Starting" value={formatLifePlanCurrency(selectedWeek.startingBalance, workspace.currencyCode)} valueClassName="text-foreground" />
              <SummaryTile label="Inflow" value={formatLifePlanCurrency(selectedWeek.totalInflow, workspace.currencyCode)} valueClassName="text-emerald-400" />
              <SummaryTile label="Outflow" value={formatLifePlanCurrency(selectedWeek.totalOutflow, workspace.currencyCode)} valueClassName="text-red-400" />
              <SummaryTile label="Ending" value={formatLifePlanCurrency(selectedWeek.endingBalance, workspace.currencyCode)} valueClassName="text-primary" />
            </div>

            <div className="space-y-3">
              {selectedWeek.events.map((event) => {
                const isEditing = editingEntryId === event.id && editingDraft !== null;

                return (
                  <div
                    key={event.id}
                    className={`rounded border p-3 ${
                      event.kind === 'income'
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-border/60 bg-background/30'
                    }`}
                  >
                    {isEditing ? (
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                        <Input value={editingDraft.label} onChange={(editEvent) => handleEditingDraftChange('label', editEvent.currentTarget.value)} />
                        <Input value={editingDraft.date} type="date" onChange={(editEvent) => handleEditingDraftChange('date', editEvent.currentTarget.value)} />
                        <Input value={editingDraft.amountUsd} type="number" step="0.01" onChange={(editEvent) => handleEditingDraftChange('amountUsd', editEvent.currentTarget.value)} />
                        <Select options={ENTRY_KIND_OPTIONS} value={editingDraft.kind} onChange={(value) => isEntryKind(value) && handleEditingDraftChange('kind', value)} />
                        <Select options={ENTRY_CATEGORY_OPTIONS} value={editingDraft.category} onChange={(value) => isEntryCategory(value) && handleEditingDraftChange('category', value)} />
                        <Select options={ENTRY_CONFIDENCE_OPTIONS} value={editingDraft.confidence} onChange={(value) => isEntryConfidence(value) && handleEditingDraftChange('confidence', value)} />
                        <div className="md:col-span-2 xl:col-span-4">
                          <Input value={editingDraft.notes} onChange={(editEvent) => handleEditingDraftChange('notes', editEvent.currentTarget.value)} />
                        </div>
                        <div className="flex gap-2 md:col-span-2 xl:col-span-2 xl:justify-end">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              const updateInput = buildUpdateInput(editingDraft);

                              if (updateInput !== null) {
                                onUpdateEntry(event.id, updateInput);
                                setEditingEntryId(null);
                                setEditingDraft(null);
                              }
                            }}
                          >
                            Save
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => {
                            setEditingEntryId(null);
                            setEditingDraft(null);
                          }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">{event.label}</span>
                              <Badge variant={getStatusVariant(event.status)}>{event.status}</Badge>
                              <Badge variant="outline">{event.kind}</Badge>
                              {event.kind === 'income' ? <Badge variant="success">Weekly divider</Badge> : null}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {event.date} · {getEntryCategoryLabel(event.category)} · {getEntryConfidenceLabel(event.confidence)}
                            </div>
                            {event.notes !== undefined ? <p className="mt-1 text-xs text-muted-foreground">{event.notes}</p> : null}
                          </div>
                          <div className="text-right text-sm font-semibold text-foreground">
                            {event.direction === 'inflow' ? '+' : '-'}
                            {formatLifePlanCurrency(event.amount, event.currencyCode)}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {ENTRY_STATUS_OPTIONS.map((status) => (
                            <Button
                              key={`${event.id}-${status}`}
                              type="button"
                              size="sm"
                              variant={event.status === status ? 'default' : 'outline'}
                              onClick={() =>
                                onTransitionEntryStatus(event.id, {
                                  changedAt: new Date().toISOString(),
                                  nextStatus: status,
                                })
                              }
                            >
                              {status}
                            </Button>
                          ))}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingEntryId(event.id);
                              setEditingDraft(createDraftFromEvent(event));
                            }}
                          >
                            Edit
                          </Button>
                          <Button type="button" size="sm" variant="destructive" onClick={() => onDeleteEntry(event.id)}>
                            Delete
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </DataCard>
      )}
    </div>
  );
}

interface SummaryTileProps {
  label: string;
  value: string;
  valueClassName: string;
}

function SummaryTile({ label, value, valueClassName }: SummaryTileProps): JSX.Element {
  return (
    <div className="rounded border border-border/60 bg-background/30 p-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">{label}</div>
      <div className={`mt-2 text-lg font-semibold ${valueClassName}`}>{value}</div>
    </div>
  );
}

const ENTRY_KIND_OPTIONS = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
  { label: 'Debt', value: 'debt' },
];

const ENTRY_CATEGORY_OPTIONS = [
  { label: 'Debt payment', value: 'debtPayment' },
  { label: 'Family support', value: 'familySupport' },
  { label: 'Food and fuel', value: 'foodAndFuel' },
  { label: 'Housing', value: 'housing' },
  { label: 'Income', value: 'income' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'Subscription', value: 'subscription' },
  { label: 'Tuition', value: 'tuition' },
  { label: 'Utility', value: 'utility' },
  { label: 'Other', value: 'other' },
];

const ENTRY_CONFIDENCE_OPTIONS = [
  { label: 'Verified', value: 'verified' },
  { label: 'Estimated', value: 'estimated' },
  { label: 'Needs review', value: 'needsReview' },
];

const ENTRY_STATUS_OPTIONS: OperatingEntryStatus[] = ['planned', 'done', 'skipped'];

function isEntryKind(value: string): value is CreateOperatingEntryInput['kind'] {
  return value === 'expense' || value === 'income' || value === 'debt';
}

function isEntryCategory(value: string): value is CreateOperatingEntryInput['category'] {
  return ENTRY_CATEGORY_OPTIONS.some((option) => option.value === value);
}

function isEntryConfidence(value: string): value is CreateOperatingEntryInput['confidence'] {
  return value === 'verified' || value === 'estimated' || value === 'needsReview';
}
