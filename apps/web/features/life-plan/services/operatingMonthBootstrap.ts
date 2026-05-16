import { MAY_2026_REAL_DATA_SNAPSHOT } from '../realDataSnapshot';
import { buildOperatingMonthFromSnapshot } from './operatingMonthAdapter';
import {
  buildOperatingMonthFromRecurringTemplates,
  seedOperatingMonthFromPreviousMonth,
} from './operatingRecurringQueue';
import type {
  DebtTrack,
  EntryStatusHistory,
  OperatingDebtPaymentEvent,
  OperatingEntry,
  OperatingMonth,
  OperatingRecurringTemplate,
  OperatingWeek,
} from '../types';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function resolveWeekId(weeks: OperatingWeek[], date: string): string {
  const matchedWeek = weeks.find((week) => date >= week.startDate && date <= week.endDate);

  return matchedWeek?.id ?? weeks[0]?.id ?? '';
}

function normalizeDebtTracks(sourceDebtTracks: DebtTrack[]): { debtIdMap: Map<string, string>; debtTracks: DebtTrack[] } {
  const debtIdMap = new Map<string, string>();

  const debtTracks = sourceDebtTracks.map((debtTrack) => {
    const nextDebtId = isUuid(debtTrack.id) ? debtTrack.id : crypto.randomUUID();
    debtIdMap.set(debtTrack.id, nextDebtId);

    return {
      ...debtTrack,
      id: nextDebtId,
    } satisfies DebtTrack;
  });

  return { debtIdMap, debtTracks };
}

function normalizeRecurringTemplates(
  sourceTemplates: OperatingRecurringTemplate[],
  debtIdMap: Map<string, string>,
): { recurringTemplateIdMap: Map<string, string>; recurringTemplates: OperatingRecurringTemplate[] } {
  const recurringTemplateIdMap = new Map<string, string>();

  const recurringTemplates = sourceTemplates.map((template) => {
    const nextTemplateId = isUuid(template.id) ? template.id : crypto.randomUUID();
    recurringTemplateIdMap.set(template.id, nextTemplateId);

    return {
      ...template,
      ...(template.debtId === undefined ? {} : { debtId: debtIdMap.get(template.debtId) ?? template.debtId }),
      id: nextTemplateId,
    } satisfies OperatingRecurringTemplate;
  });

  return { recurringTemplateIdMap, recurringTemplates };
}

function normalizeEntries(
  sourceEntries: OperatingEntry[],
  targetWeeks: OperatingWeek[],
  debtIdMap: Map<string, string>,
  recurringTemplateIdMap: Map<string, string>,
): { entries: OperatingEntry[]; entryIdMap: Map<string, string> } {
  const entryIdMap = new Map<string, string>();

  const entries = sourceEntries.map((entry) => {
    const nextEntryId = isUuid(entry.id) ? entry.id : crypto.randomUUID();
    entryIdMap.set(entry.id, nextEntryId);

    return {
      ...entry,
      ...(entry.debtId === undefined ? {} : { debtId: debtIdMap.get(entry.debtId) ?? entry.debtId }),
      id: nextEntryId,
      ...(entry.templateId === undefined ? {} : { templateId: recurringTemplateIdMap.get(entry.templateId) ?? entry.templateId }),
      weekId: resolveWeekId(targetWeeks, entry.date),
    } satisfies OperatingEntry;
  });

  return { entries, entryIdMap };
}

function normalizeStatusHistory(
  sourceStatusHistory: EntryStatusHistory[],
  entryIdMap: Map<string, string>,
): EntryStatusHistory[] {
  return sourceStatusHistory.map((historyEntry) => ({
    ...historyEntry,
    entryId: entryIdMap.get(historyEntry.entryId) ?? historyEntry.entryId,
    id: isUuid(historyEntry.id) ? historyEntry.id : crypto.randomUUID(),
  }));
}

function normalizeDebtPaymentEvents(
  sourceDebtPaymentEvents: OperatingDebtPaymentEvent[],
  debtIdMap: Map<string, string>,
  entryIdMap: Map<string, string>,
): OperatingDebtPaymentEvent[] {
  return sourceDebtPaymentEvents.map((paymentEvent) => ({
    ...paymentEvent,
    debtId: debtIdMap.get(paymentEvent.debtId) ?? paymentEvent.debtId,
    entryId: entryIdMap.get(paymentEvent.entryId) ?? paymentEvent.entryId,
    id: isUuid(paymentEvent.id) ? paymentEvent.id : crypto.randomUUID(),
  }));
}

export function createSeedOperatingMonth(): OperatingMonth {
  return buildOperatingMonthFromSnapshot(MAY_2026_REAL_DATA_SNAPSHOT);
}

export function rebaseOperatingMonthForPersistence(
  sourceMonth: OperatingMonth,
  targetMonth: OperatingMonth,
  seededFromMonthId: string | null,
): OperatingMonth {
  const { debtIdMap, debtTracks } = normalizeDebtTracks(sourceMonth.debtTracks);
  const { recurringTemplateIdMap, recurringTemplates } = normalizeRecurringTemplates(
    sourceMonth.recurringTemplates,
    debtIdMap,
  );
  const { entries, entryIdMap } = normalizeEntries(
    sourceMonth.entries,
    targetMonth.weeks,
    debtIdMap,
    recurringTemplateIdMap,
  );

  return {
    ...targetMonth,
    debtPaymentEvents: normalizeDebtPaymentEvents(sourceMonth.debtPaymentEvents, debtIdMap, entryIdMap),
    debtTracks,
    entries,
    recurringQueue: targetMonth.recurringQueue,
    recurringTemplates,
    seededFromMonthId,
    statusHistory: normalizeStatusHistory(sourceMonth.statusHistory, entryIdMap),
  };
}

export function createInitialBootstrapMonth(targetMonth: OperatingMonth): OperatingMonth {
  return rebaseOperatingMonthForPersistence(createSeedOperatingMonth(), targetMonth, null);
}

export function createDerivedRecurringBootstrapMonth(
  previousMonth: OperatingMonth,
  targetMonth: OperatingMonth,
): OperatingMonth {
  return rebaseOperatingMonthForPersistence(
    buildOperatingMonthFromRecurringTemplates(previousMonth, targetMonth.month),
    targetMonth,
    previousMonth.id,
  );
}

export function createSeededPreviousMonthBootstrap(
  previousMonth: OperatingMonth,
  targetMonth: OperatingMonth,
): OperatingMonth {
  return rebaseOperatingMonthForPersistence(
    seedOperatingMonthFromPreviousMonth(previousMonth, targetMonth.month),
    targetMonth,
    previousMonth.id,
  );
}
