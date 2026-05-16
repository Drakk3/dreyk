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
  CashFlowWorkspaceWeekEvent,
  OperatingMonth,
  WeeklyCashFlowWorkspace as WeeklyCashFlowWorkspaceModel,
} from '../types';
import type {
  CreateOperatingEntryInput,
  TransitionOperatingEntryStatusInput,
  UpdateOperatingEntryInput,
} from '../services/operatingEntryMutations';
import { formatLifePlanCurrency } from '../services/lifePlanCurrency';
import {
  buildCopiedEntryInput,
  buildEntryInput,
  buildUpdateInput,
  createDraftFromEvent,
  createEntryDraft,
  getMonthWeekGroups,
  getPendingItemCount,
  getSelectedWeek,
  getStatusVariant,
  getWeekNavigationState,
  type EntryDraftState,
} from '../services/weeklyCashFlowWorkspaceView';

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

type ManualEntryMode = 'copy' | 'create';

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
  const [manualEntryMode, setManualEntryMode] = React.useState<ManualEntryMode>('create');
  const [copySourceEntryId, setCopySourceEntryId] = React.useState<string>('');
  const selectedWeek = React.useMemo(() => getSelectedWeek(workspace.weeks, selectedWeekId), [selectedWeekId, workspace.weeks]);
  const monthWeekGroups = React.useMemo(() => getMonthWeekGroups(activeMonth), [activeMonth]);
  const pendingItemCount = React.useMemo(() => getPendingItemCount(activeMonth.entries), [activeMonth.entries]);
  const copyableMonthItemOptions = React.useMemo(() => {
    return activeMonth.entries.map((entry) => ({
      label: entry.label,
      value: entry.id,
    }));
  }, [activeMonth.entries]);
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
    setManualEntryMode('create');
    setCopySourceEntryId('');
    setIsQueueExpanded(monthWeekGroups.length > 0 || isMonthEmpty);
  }, [activeMonth, isMonthEmpty, monthWeekGroups.length]);

  const handleResetManualEntryModal = React.useCallback((): void => {
    setDraft(createEntryDraft(activeMonth));
    setManualEntryMode('create');
    setCopySourceEntryId('');
    setIsManualEntryOpen(false);
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
              <SummaryTile
                label="Pending items"
                value={String(pendingItemCount)}
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
          title="All items this month"
          headerRight={
            <div className="flex items-center gap-2">
              <Badge variant="outline">{pendingItemCount} pending</Badge>
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
            ) : monthWeekGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items exist for this month yet.</p>
            ) : (
              <Accordion type="single" collapsible value={isQueueExpanded ? 'recurring-queue' : ''} onValueChange={(value) => setIsQueueExpanded(value === 'recurring-queue')}>
                <AccordionItem value="recurring-queue" className="rounded border border-border/60 bg-background/30 px-3">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="space-y-1">
                      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/50">Queue summary</div>
                      <div className="text-sm font-semibold text-foreground">{activeMonth.entries.length} items across weekly groups</div>
                      <div className="text-xs text-muted-foreground">
                        Expand for compact weekly rows with status.
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="divide-y divide-border/60 border-t border-border/60 pt-3">
                      {monthWeekGroups.map((group) => (
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
                                  <Badge variant={getStatusVariant(entry.status)}>{entry.status}</Badge>
                                  <span>{formatLifePlanCurrency(entry.amountUsd, activeMonth.currencyCode)}</span>
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 sm:flex sm:items-center sm:justify-center">
          <div className="mx-auto my-6 w-full max-w-4xl rounded border border-border/70 bg-background shadow-2xl sm:my-0">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Item action</div>
                <h2 className="mt-1 text-lg font-semibold uppercase tracking-[0.12em] text-foreground">Add cash-flow item</h2>
              </div>
              <Button type="button" size="icon-sm" variant="ghost" onClick={handleResetManualEntryModal}>
                <X />
                <span className="sr-only">Close manual entry modal</span>
              </Button>
            </div>

            <div className="p-4 max-sm:max-h-[calc(100vh-8rem)] max-sm:overflow-y-auto">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:items-start">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
                <Select
                  label="Mode"
                  options={MANUAL_ENTRY_MODE_OPTIONS}
                  value={manualEntryMode}
                  onChange={(value) => {
                    if (isManualEntryMode(value)) {
                      setManualEntryMode(value);
                      setCopySourceEntryId('');
                    }
                  }}
                />
                {manualEntryMode === 'copy' ? (
                  <Select
                    label="Item name"
                    options={copyableMonthItemOptions}
                    value={copySourceEntryId}
                    placeholder={copyableMonthItemOptions.length === 0 ? 'No items available' : 'Select item name'}
                    disabled={copyableMonthItemOptions.length === 0}
                    onChange={(value) => {
                      const sourceEntry = activeMonth.entries.find((entry) => entry.id === value);

                      setCopySourceEntryId(value);

                      if (sourceEntry !== undefined) {
                        onCreateEntry(buildCopiedEntryInput(sourceEntry));
                        handleResetManualEntryModal();
                      }
                    }}
                  />
                ) : (
                  <>
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
                  </>
                )}
              </div>
              <div className="space-y-3">
                {manualEntryMode === 'copy' ? (
                  <>
                    <div className="rounded border border-dashed border-border/60 bg-background/20 p-4 text-sm text-muted-foreground">
                      Choose an existing item name to copy it into the current month. The duplicate is created immediately and starts as <span className="font-medium text-foreground">planned</span>.
                    </div>
                    <Button type="button" variant="outline" onClick={handleResetManualEntryModal}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
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
                            handleResetManualEntryModal();
                          }
                        }}
                      >
                        Add entry
                      </Button>
                      <Button type="button" variant="outline" onClick={handleResetManualEntryModal}>
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
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

const MANUAL_ENTRY_MODE_OPTIONS: Array<{ label: string; value: ManualEntryMode }> = [
  { label: 'Create new item', value: 'create' },
  { label: 'Copy existing item', value: 'copy' },
];

const ENTRY_CATEGORY_OPTIONS: Array<{ label: string; value: CreateOperatingEntryInput['category'] }> = [
  { label: 'Debt payment', value: 'debtPayment' },
  { label: 'Family support', value: 'familySupport' },
  { label: 'Food', value: 'food' },
  { label: 'Gas', value: 'gas' },
  { label: 'Housing', value: 'housing' },
  { label: 'Income', value: 'income' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'Investing', value: 'investing' },
  { label: 'Savings', value: 'savings' },
  { label: 'Subscription', value: 'subscription' },
  { label: 'Education', value: 'education' },
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

function isManualEntryMode(value: string): value is ManualEntryMode {
  return value === 'create' || value === 'copy';
}

function isEntryCategory(value: string): value is CreateOperatingEntryInput['category'] {
  return ENTRY_CATEGORY_OPTIONS.some((option) => option.value === value);
}

function isEntryConfidence(value: string): value is CreateOperatingEntryInput['confidence'] {
  return value === 'verified' || value === 'estimated' || value === 'needsReview';
}
