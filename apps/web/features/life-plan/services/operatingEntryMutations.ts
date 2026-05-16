import type {
  FinancialSourceMetadata,
  OperatingEntry,
  OperatingEntryKind,
  OperatingEntryStatus,
  OperatingEntrySourceKind,
  OperatingMonth,
  OperatingWeek,
} from '../types';

export interface CreateOperatingEntryInput {
  amountUsd: number;
  category: OperatingEntry['category'];
  confidence: OperatingEntry['confidence'];
  date: string;
  debtId?: string;
  kind: OperatingEntryKind;
  label: string;
  notes?: string;
  source: FinancialSourceMetadata;
  sourceKind: OperatingEntrySourceKind;
  status?: OperatingEntryStatus;
}

export interface UpdateOperatingEntryInput {
  amountUsd: number;
  category: OperatingEntry['category'];
  confidence: OperatingEntry['confidence'];
  date: string;
  debtId?: string;
  kind: OperatingEntryKind;
  label: string;
  notes?: string;
}

export interface TransitionOperatingEntryStatusInput {
  changedAt: string;
  nextStatus: OperatingEntryStatus;
  reason?: string;
}

function sortEntries(entries: OperatingEntry[]): OperatingEntry[] {
  return [...entries].sort((leftEntry, rightEntry) => {
    if (leftEntry.date !== rightEntry.date) {
      return leftEntry.date.localeCompare(rightEntry.date);
    }

    if (leftEntry.kind !== rightEntry.kind) {
      if (leftEntry.kind === 'income') {
        return -1;
      }

      if (rightEntry.kind === 'income') {
        return 1;
      }
    }

    return leftEntry.label.localeCompare(rightEntry.label);
  });
}

function syncWeeks(weeks: OperatingWeek[], entries: OperatingEntry[]): OperatingWeek[] {
  return weeks.map((week) => {
    const entryIds = entries
      .filter((entry) => entry.weekId === week.id)
      .map((entry) => entry.id);

    return {
      ...week,
      entryIds,
    };
  });
}

function resolveWeekId(month: OperatingMonth, date: string): string {
  const matchedWeek = month.weeks.find((week) => date >= week.startDate && date <= week.endDate);

  return matchedWeek?.id ?? month.weeks[0]?.id ?? '';
}

function createEntryId(monthId: string, date: string, label: string): string {
  const normalizedLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  return `${monthId}-${date}-${normalizedLabel || 'entry'}-${crypto.randomUUID().slice(0, 8)}`;
}

function updateMonthEntries(month: OperatingMonth, entries: OperatingEntry[]): OperatingMonth {
  const sortedEntries = sortEntries(entries);

  return {
    ...month,
    entries: sortedEntries,
    weeks: syncWeeks(month.weeks, sortedEntries),
  };
}

export function createOperatingEntry(month: OperatingMonth, input: CreateOperatingEntryInput): OperatingMonth {
  const weekId = resolveWeekId(month, input.date);
  const entry: OperatingEntry = {
    amountUsd: input.amountUsd,
    category: input.category,
    confidence: input.confidence,
    date: input.date,
    ...(input.debtId === undefined ? {} : { debtId: input.debtId }),
    id: createEntryId(month.id, input.date, input.label),
    kind: input.kind,
    label: input.label,
    ...(input.notes === undefined ? {} : { notes: input.notes }),
    source: input.source,
    sourceKind: input.sourceKind,
    status: input.status ?? 'planned',
    weekId,
  };

  return updateMonthEntries(month, [...month.entries, entry]);
}

export function updateOperatingEntry(
  month: OperatingMonth,
  entryId: string,
  input: UpdateOperatingEntryInput,
): OperatingMonth {
  const existingEntry = month.entries.find((entry) => entry.id === entryId);

  if (existingEntry === undefined) {
    return month;
  }

  const weekId = resolveWeekId(month, input.date);
  const nextEntries = month.entries.map((entry) => {
    if (entry.id !== entryId) {
      return entry;
    }

    return {
      ...entry,
      amountUsd: input.amountUsd,
      category: input.category,
      confidence: input.confidence,
      date: input.date,
      ...(input.debtId === undefined ? {} : { debtId: input.debtId }),
      kind: input.kind,
      label: input.label,
      ...(input.notes === undefined ? {} : { notes: input.notes }),
      weekId,
    };
  });

  return updateMonthEntries(month, nextEntries);
}

export function deleteOperatingEntry(month: OperatingMonth, entryId: string): OperatingMonth {
  const nextEntries = month.entries.filter((entry) => entry.id !== entryId);
  const nextStatusHistory = month.statusHistory.filter((historyEntry) => historyEntry.entryId !== entryId);
  const nextRecurringQueue: OperatingMonth['recurringQueue'] = month.recurringQueue.map((item) => {
    if (item.entryId !== entryId) {
      return item;
    }

    const queueItemWithoutEntryId = { ...item };
    delete queueItemWithoutEntryId.entryId;

    return {
      ...queueItemWithoutEntryId,
      status: 'pending' as const,
    };
  });

  return {
    ...updateMonthEntries(month, nextEntries),
    recurringQueue: nextRecurringQueue,
    statusHistory: nextStatusHistory,
  };
}

export function transitionOperatingEntryStatus(
  month: OperatingMonth,
  entryId: string,
  input: TransitionOperatingEntryStatusInput,
): OperatingMonth {
  const currentEntry = month.entries.find((entry) => entry.id === entryId);

  if (currentEntry === undefined || currentEntry.status === input.nextStatus) {
    return month;
  }

  const nextEntries = month.entries.map((entry) => {
    if (entry.id !== entryId) {
      return entry;
    }

    return {
      ...entry,
      status: input.nextStatus,
    };
  });

  return {
    ...updateMonthEntries(month, nextEntries),
    statusHistory: [
      ...month.statusHistory,
      {
        changedAt: input.changedAt,
        entryId,
        from: currentEntry.status,
        id: `${entryId}-${input.changedAt}-${input.nextStatus}`,
        ...(input.reason === undefined ? {} : { reason: input.reason }),
        to: input.nextStatus,
      },
    ],
  };
}
