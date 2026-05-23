import type { OperatingMonth } from '../types';
import type { CashFlowWorkspaceWeek, CashFlowWorkspaceWeekEvent, OperatingEntryStatus } from '../types';
import type {
  CreateOperatingEntryInput,
  UpdateOperatingEntryInput,
} from './operatingEntryMutations';

export interface EntryDraftState {
  amountUsd: string;
  category: CreateOperatingEntryInput['category'];
  confidence: CreateOperatingEntryInput['confidence'];
  date: string;
  kind: CreateOperatingEntryInput['kind'];
  label: string;
  notes: string;
}

export interface WeekNavigationState {
  canGoNext: boolean;
  canGoPrevious: boolean;
  nextWeekId: string | null;
  previousWeekId: string | null;
}

export interface MonthWeekGroup {
  entries: OperatingMonth['entries'];
  totalOutflow: number;
  weekId: string;
  weekLabel: string;
}

export interface IncomeSummaryBreakdownRow {
  itemLabel: string;
  itemType: 'income';
  totalAmountUsd: number;
}

export interface OutflowSummaryBreakdownRow {
  category: CreateOperatingEntryInput['category'];
  itemLabel: string;
  itemType: 'outflow';
  totalAmountUsd: number;
}

export type MonthSummaryBreakdownRow = IncomeSummaryBreakdownRow | OutflowSummaryBreakdownRow;

export interface MonthSummaryBreakdownSection {
  id: 'income' | 'outflow';
  label: string;
  rows: MonthSummaryBreakdownRow[];
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function isProjectedEntry(entry: OperatingMonth['entries'][number]): boolean {
  return entry.status !== 'skipped';
}

export function createEntryDraft(activeMonth: OperatingMonth): EntryDraftState {
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

export function buildEntryInput(
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

export function buildCopiedEntryInput(entry: OperatingMonth['entries'][number]): CreateOperatingEntryInput {
  return {
    amountUsd: entry.amountUsd,
    category: entry.category,
    confidence: entry.confidence,
    date: entry.date,
    ...(entry.debtId === undefined ? {} : { debtId: entry.debtId }),
    kind: entry.kind,
    label: entry.label,
    ...(entry.notes === undefined ? {} : { notes: entry.notes }),
    source: {
      capturedOn: new Date().toISOString().slice(0, 10),
      kind: 'manual',
      label: 'Life plan copied item',
    },
    sourceKind: 'manual',
    status: 'planned',
  };
}

export function buildUpdateInput(draft: EntryDraftState): UpdateOperatingEntryInput | null {
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

export function createDraftFromEvent(event: CashFlowWorkspaceWeekEvent): EntryDraftState {
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

export function getStatusVariant(status: OperatingEntryStatus): 'default' | 'outline' | 'warning' {
  if (status === 'done') {
    return 'default';
  }

  if (status === 'skipped') {
    return 'warning';
  }

  return 'outline';
}

export function getSelectedWeek(
  weeks: CashFlowWorkspaceWeek[],
  selectedWeekId: string | null,
): CashFlowWorkspaceWeek | null {
  if (selectedWeekId === null) {
    return weeks[0] ?? null;
  }

  return weeks.find((week) => week.id === selectedWeekId) ?? weeks[0] ?? null;
}

export function getMonthWeekGroups(activeMonth: OperatingMonth): MonthWeekGroup[] {
  return activeMonth.weeks
    .map((week) => ({
      entries: activeMonth.entries.filter((entry) => entry.weekId === week.id),
      totalOutflow: roundCurrency(
        activeMonth.entries
          .filter((entry) => entry.weekId === week.id && entry.kind !== 'income' && isProjectedEntry(entry))
          .reduce((sum, entry) => sum + entry.amountUsd, 0),
      ),
      weekId: week.id,
      weekLabel: week.label,
    }))
    .filter((group) => group.entries.length > 0);
}

export function getMonthSummaryBreakdown(activeMonth: OperatingMonth): MonthSummaryBreakdownSection[] {
  const incomeTotals = new Map<string, number>();
  const outflowTotals = new Map<CreateOperatingEntryInput['category'], number>();

  activeMonth.entries.filter(isProjectedEntry).forEach((entry) => {
    if (entry.kind === 'income') {
      incomeTotals.set(entry.label, roundCurrency((incomeTotals.get(entry.label) ?? 0) + entry.amountUsd));

      return;
    }

    outflowTotals.set(entry.category, roundCurrency((outflowTotals.get(entry.category) ?? 0) + entry.amountUsd));
  });

  const incomeRows = [...incomeTotals.entries()]
    .map(([itemLabel, totalAmountUsd]) => ({
      itemLabel,
      itemType: 'income' as const,
      totalAmountUsd,
    }))
    .sort((leftRow, rightRow) => {
      if (rightRow.totalAmountUsd !== leftRow.totalAmountUsd) {
        return rightRow.totalAmountUsd - leftRow.totalAmountUsd;
      }

      return leftRow.itemLabel.localeCompare(rightRow.itemLabel);
    });

  const outflowRows = [...outflowTotals.entries()]
    .map(([category, totalAmountUsd]) => ({
      category,
      itemLabel: category,
      itemType: 'outflow' as const,
      totalAmountUsd,
    }))
    .sort((leftRow, rightRow) => {
      if (rightRow.totalAmountUsd !== leftRow.totalAmountUsd) {
        return rightRow.totalAmountUsd - leftRow.totalAmountUsd;
      }

      return leftRow.itemLabel.localeCompare(rightRow.itemLabel);
    });

  return [
    {
      id: 'income' as const,
      label: 'Income labels',
      rows: incomeRows,
    },
    {
      id: 'outflow' as const,
      label: 'Outflow categories',
      rows: outflowRows,
    },
  ].filter((section) => section.rows.length > 0);
}

export function getPendingItemCount(entries: OperatingMonth['entries']): number {
  return entries.filter((entry) => entry.status === 'planned').length;
}

export function getWeekNavigationState(
  weeks: CashFlowWorkspaceWeek[],
  selectedWeekId: string | null,
): WeekNavigationState {
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
