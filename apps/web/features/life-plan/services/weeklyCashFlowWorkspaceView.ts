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
  weekId: string;
  weekLabel: string;
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
      weekId: week.id,
      weekLabel: week.label,
    }))
    .filter((group) => group.entries.length > 0);
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
