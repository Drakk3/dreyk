'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Pencil, RotateCcw, Trash2, X } from 'lucide-react';

import { Badge } from '@/components/thegridcn/badge';
import { DataCard } from '@/components/thegridcn/data-card';
import { Select } from '@/components/thegridcn/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import type { OperatingMonthOption } from '../hooks/useLifePlanDashboard';
import type {
  CashFlowWorkspaceWeek,
  CashFlowWorkspaceWeekEvent,
  OperatingEntry,
  OperatingEntryStatus,
  OperatingMonth,
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
  onNavigateMonth: (offset: number) => void;
  onSelectMonth: (monthId: string) => void;
  onSeedFromPreviousMonth: () => void;
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

interface WeekNavigationState {
  canGoNext: boolean;
  canGoPrevious: boolean;
  nextWeekId: string | null;
  previousWeekId: string | null;
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

interface PendingMonthWeekGroup {
  entries: OperatingEntry[];
  weekId: string;
  weekLabel: string;
}

function getPendingMonthWeekGroups(activeMonth: OperatingMonth): PendingMonthWeekGroup[] {
  return activeMonth.weeks
    .map((week) => ({
      entries: activeMonth.entries.filter((entry) => entry.weekId === week.id && entry.status === 'planned'),
      weekId: week.id,
      weekLabel: week.label,
    }))
    .filter((group) => group.entries.length > 0);
}

function getWeekNavigationState(weeks: CashFlowWorkspaceWeek[], selectedWeekId: string | null): WeekNavigationState {
  const selectedWeek = getSelectedWeek(weeks, selectedWeekId);
  const selectedWeekIndex = selectedWeek === null ? -1 : weeks.findIndex((week) => week.id === selectedWeek.id);

  if (selectedWeekIndex < 0) {
    return {
      canGoNext: false,
      canGoPrevious: false,
      nextWeekId: null,
      previousWeekId: null,
    };
  }

  return {
    canGoNext: selectedWeekIndex < weeks.length - 1,
    canGoPrevious: selectedWeekIndex > 0,
    nextWeekId: weeks[selectedWeekIndex + 1]?.id ?? null,
    previousWeekId: weeks[selectedWeekIndex - 1]?.id ?? null,
  };
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
  onNavigateMonth,
  onSelectMonth,
  onSeedFromPreviousMonth,
  onSelectWeek,
  onTransitionEntryStatus,
  onUpdateEntry,
  selectedWeekId,
  workspace,
}: WeeklyCashFlowWorkspaceProps): JSX.Element {
  const [draft, setDraft] = React.useState<EntryDraftState>(() => createEntryDraft(activeMonth));
  const [editingEntryId, setEditingEntryId] = React.useState<string | null>(null);
  const [editingDraft, setEditingDraft] = React.useState<EntryDraftState | null>(null);
  const [isQueueExpanded, setIsQueueExpanded] = React.useState<boolean>(true);
  const [isManualEntryOpen, setIsManualEntryOpen] = React.useState<boolean>(false);
  const selectedWeek = React.useMemo(() => getSelectedWeek(workspace.weeks, selectedWeekId), [selectedWeekId, workspace.weeks]);
  const pendingMonthWeekGroups = React.useMemo(() => getPendingMonthWeekGroups(activeMonth), [activeMonth]);
  const weekNavigation = React.useMemo(
    () => getWeekNavigationState(workspace.weeks, selectedWeekId),
    [selectedWeekId, workspace.weeks],
  );
  const isMonthEmpty = activeMonth.entries.length === 0;

  React.useEffect(() => {
    setDraft(createEntryDraft(activeMonth));
    setEditingEntryId(null);
    setEditingDraft(null);
    setIsManualEntryOpen(false);
    setIsQueueExpanded(pendingMonthWeekGroups.length > 0 || isMonthEmpty);
  }, [activeMonth, isMonthEmpty, pendingMonthWeekGroups.length]);

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
              <SummaryTile
                label="Pending items"
                value={String(pendingMonthWeekGroups.reduce((sum, group) => sum + group.entries.length, 0))}
                valueClassName="text-foreground"
              />
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

        <DataCard
          subtitle="MONTH ITEMS"
          title="Pending items this month"
          headerRight={
            <div className="flex items-center gap-2">
              <Badge variant="outline">{pendingMonthWeekGroups.reduce((sum, group) => sum + group.entries.length, 0)} pending</Badge>
              <Button type="button" size="sm" onClick={() => setIsManualEntryOpen(true)}>
                Add cash-flow item
              </Button>
            </div>
          }
        >
          <div className="p-4">
            {isMonthEmpty ? (
              <div className="rounded border border-dashed border-border/60 bg-background/20 p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Empty month</div>
                <p className="mt-2 text-sm text-muted-foreground">This month has no items yet. Start with items from the previous month or add entries manually.</p>
                <Button className="mt-3" type="button" onClick={onSeedFromPreviousMonth}>
                  Start with items from previous month
                </Button>
              </div>
            ) : pendingMonthWeekGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending items remain for this month.</p>
            ) : (
              <Accordion type="single" collapsible value={isQueueExpanded ? 'recurring-queue' : ''} onValueChange={(value) => setIsQueueExpanded(value === 'recurring-queue')}>
                <AccordionItem value="recurring-queue" className="rounded border border-border/60 bg-background/30 px-3">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="space-y-1">
                      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/50">Queue summary</div>
                      <div className="text-sm font-semibold text-foreground">{pendingMonthWeekGroups.reduce((sum, group) => sum + group.entries.length, 0)} pending items this month</div>
                      <div className="text-xs text-muted-foreground">
                        Expand for compact weekly rows.
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="divide-y divide-border/60 border-t border-border/60 pt-3">
                      {pendingMonthWeekGroups.map((group) => (
                        <div key={group.weekId} className="py-3">
                          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">{group.weekLabel}</div>
                          <div className="space-y-1.5">
                            {group.entries.map((entry) => (
                              <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                                <div className="min-w-0 flex-1">
                                  <span>{entry.date}</span>
                                  <span className="mx-1.5 text-foreground/30">·</span>
                                  <span className="font-medium text-foreground">{entry.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="warning">pending</Badge>
                                  <span>{formatLifePlanCurrency(entry.amountUsd, 'USD')}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        </DataCard>
      </div>

      {isManualEntryOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-4xl rounded border border-border/70 bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Manual entry</div>
                <h2 className="mt-1 text-lg font-semibold uppercase tracking-[0.12em] text-foreground">Add cash-flow item</h2>
              </div>
              <Button type="button" size="icon-sm" variant="ghost" onClick={() => setIsManualEntryOpen(false)}>
                <X />
                <span className="sr-only">Close manual entry modal</span>
              </Button>
            </div>

            <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:items-start">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
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
                <div className="md:col-span-2">
                  <Select
                    options={ENTRY_CONFIDENCE_OPTIONS}
                    value={draft.confidence}
                    onChange={(value) => {
                      if (isEntryConfidence(value)) {
                        handleDraftChange('confidence', value);
                      }
                    }}
                  />
                </div>
                <div className="md:col-span-2">
                  <Input value={draft.notes} placeholder="Notes (optional)" onChange={(event) => handleDraftChange('notes', event.currentTarget.value)} />
                </div>
              </div>
              <div className="space-y-3">
                <Select
                  label="Category"
                  options={ENTRY_CATEGORY_OPTIONS}
                  value={draft.category}
                  onChange={(value) => {
                    if (isEntryCategory(value)) {
                      handleDraftChange('category', value);
                    }
                  }}
                />
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => {
                      const entryInput = buildEntryInput(draft, 'Life plan manual entry');

                      if (entryInput !== null) {
                        onCreateEntry(entryInput);
                        setDraft(createEntryDraft(activeMonth));
                        setIsManualEntryOpen(false);
                      }
                    }}
                  >
                    Add entry
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsManualEntryOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedWeek === null ? null : (
        <DataCard
          subtitle="WEEK DETAIL"
          title={selectedWeek.label}
          headerRight={
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                disabled={!weekNavigation.canGoPrevious}
                onClick={() => {
                  if (weekNavigation.previousWeekId !== null) {
                    onSelectWeek(weekNavigation.previousWeekId);
                  }
                }}
              >
                <ChevronLeft />
                <span className="sr-only">Previous week</span>
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                disabled={!weekNavigation.canGoNext}
                onClick={() => {
                  if (weekNavigation.nextWeekId !== null) {
                    onSelectWeek(weekNavigation.nextWeekId);
                  }
                }}
              >
                <ChevronRight />
                <span className="sr-only">Next week</span>
              </Button>
              {selectedWeek.reviewItemCount > 0 ? <Badge variant="warning">{selectedWeek.reviewItemCount} review</Badge> : null}
            </div>
          }
        >
          <div className="space-y-4 p-4">
            <div className="grid gap-3 md:grid-cols-4">
              <SummaryTile label="Starting" value={formatLifePlanCurrency(selectedWeek.startingBalance, workspace.currencyCode)} valueClassName="text-foreground" />
              <SummaryTile label="Inflow" value={formatLifePlanCurrency(selectedWeek.totalInflow, workspace.currencyCode)} valueClassName="text-emerald-400" />
              <SummaryTile label="Outflow" value={formatLifePlanCurrency(selectedWeek.totalOutflow, workspace.currencyCode)} valueClassName="text-red-400" />
              <SummaryTile label="Ending" value={formatLifePlanCurrency(selectedWeek.endingBalance, workspace.currencyCode)} valueClassName="text-primary" />
            </div>

            <div className="grid gap-3 xl:grid-cols-2">
              {selectedWeek.events.map((event) => {
                const isEditing = editingEntryId === event.id && editingDraft !== null;

                return (
                  <div
                    key={event.id}
                    className={`rounded border p-3 ${
                      event.kind === 'income'
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-border/60 bg-background/30'
                    } ${isEditing ? 'xl:col-span-2' : 'xl:col-span-1'}`}
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
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-1 gap-3">
                            <Checkbox
                              checked={event.status === 'done'}
                              className="mt-0.5"
                              onCheckedChange={(checked) => {
                                onTransitionEntryStatus(event.id, {
                                  changedAt: new Date().toISOString(),
                                  nextStatus: checked === true ? 'done' : 'planned',
                                });
                              }}
                            />
                            <div className="min-w-0 flex-1">
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
                              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                {event.status !== 'skipped' ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs"
                                    onClick={() =>
                                      onTransitionEntryStatus(event.id, {
                                        changedAt: new Date().toISOString(),
                                        nextStatus: 'skipped',
                                      })
                                    }
                                  >
                                    Skip
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs"
                                    onClick={() =>
                                      onTransitionEntryStatus(event.id, {
                                        changedAt: new Date().toISOString(),
                                        nextStatus: 'planned',
                                      })
                                    }
                                  >
                                    <RotateCcw />
                                    Reset
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  size="icon-sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingEntryId(event.id);
                                    setEditingDraft(createDraftFromEvent(event));
                                  }}
                                >
                                  <Pencil />
                                  <span className="sr-only">Edit item</span>
                                </Button>
                                <Button type="button" size="icon-sm" variant="ghost" onClick={() => onDeleteEntry(event.id)}>
                                  <Trash2 />
                                  <span className="sr-only">Delete item</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-sm font-semibold text-foreground">
                            <div>
                              {event.direction === 'inflow' ? '+' : '-'}
                              {formatLifePlanCurrency(event.amount, event.currencyCode)}
                            </div>
                            {event.status === 'skipped' ? <div className="mt-1 text-xs font-normal text-muted-foreground">Skipped</div> : null}
                          </div>
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

const ENTRY_KIND_OPTIONS: Array<{ label: string; value: CreateOperatingEntryInput['kind'] }> = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
  { label: 'Debt', value: 'debt' },
];

const ENTRY_CATEGORY_OPTIONS: Array<{ label: string; value: CreateOperatingEntryInput['category'] }> = [
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

const ENTRY_CONFIDENCE_OPTIONS: Array<{ label: string; value: CreateOperatingEntryInput['confidence'] }> = [
  { label: 'Verified', value: 'verified' },
  { label: 'Estimated', value: 'estimated' },
  { label: 'Needs review', value: 'needsReview' },
];

function isEntryKind(value: string): value is CreateOperatingEntryInput['kind'] {
  return value === 'expense' || value === 'income' || value === 'debt';
}

function isEntryCategory(value: string): value is CreateOperatingEntryInput['category'] {
  return ENTRY_CATEGORY_OPTIONS.some((option) => option.value === value);
}

function isEntryConfidence(value: string): value is CreateOperatingEntryInput['confidence'] {
  return value === 'verified' || value === 'estimated' || value === 'needsReview';
}
