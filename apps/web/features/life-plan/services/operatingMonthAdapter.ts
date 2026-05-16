import type { RealDataSnapshot, RealDebtRecord, ScheduledObligation } from '../realDataSnapshot';
import { buildCashFlowCalendar } from './cashFlowCalendar';
import type {
  CashFlowEvent,
  DebtTrack,
  OperatingEntry,
  OperatingEntryKind,
  OperatingMonth,
  OperatingRecurringQueueItem,
  OperatingRecurringTemplate,
  OperatingWeek,
} from '../types';

function createWeekId(monthId: string, index: number, weekStartDate: string): string {
  return `${monthId}-week-${index + 1}-${weekStartDate}`;
}

function createWeekLabel(weekStartDate: string, weekEndDate: string): string {
  return `${weekStartDate} → ${weekEndDate}`;
}

function resolveEntryKind(event: CashFlowEvent): OperatingEntryKind {
  if (event.direction === 'inflow') {
    return 'income';
  }

  return event.category === 'debtPayment' ? 'debt' : 'expense';
}

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function inferDebtId(label: string, debtRecords: RealDebtRecord[]): string | undefined {
  const normalizedLabel = normalizeToken(label);

  return debtRecords.find((debtRecord) => {
    const normalizedCreditor = normalizeToken(debtRecord.creditor);
    const normalizedDebtLabel = normalizeToken(debtRecord.label);

    return (
      normalizedLabel.includes(normalizedCreditor) ||
      normalizedLabel.includes(normalizedDebtLabel) ||
      (normalizedLabel.includes('mazda') && debtRecord.id === 'debt-america-first-auto') ||
      (normalizedLabel.includes('upstart') && debtRecord.id === 'debt-dr-bank') ||
      (normalizedLabel.includes('cap one') && debtRecord.id === 'debt-capital-one') ||
      (normalizedLabel.includes('usbank') && debtRecord.id === 'debt-us-bank')
    );
  })?.id;
}

function buildWeekMap(snapshot: RealDataSnapshot): {
  eventWeekIdMap: Map<string, string>;
  monthId: string;
  weeks: OperatingWeek[];
} {
  const monthId = `operating-month-${snapshot.month}`;
  const calendar = buildCashFlowCalendar(snapshot);
  const eventWeekIdMap = new Map<string, string>();
  const weeks = calendar.weeklyCheckpoints.map((checkpoint, index) => {
    const weekId = createWeekId(monthId, index, checkpoint.weekStartDate);

    checkpoint.eventIds.forEach((eventId) => {
      eventWeekIdMap.set(eventId, weekId);
    });

    return {
      entryIds: checkpoint.eventIds,
      endDate: checkpoint.weekEndDate,
      id: weekId,
      index: index + 1,
      label: createWeekLabel(checkpoint.weekStartDate, checkpoint.weekEndDate),
      monthId,
      startDate: checkpoint.weekStartDate,
    } satisfies OperatingWeek;
  });

  return { eventWeekIdMap, monthId, weeks };
}

function buildOperatingEntry(
  event: CashFlowEvent,
  debtRecords: RealDebtRecord[],
  eventWeekIdMap: Map<string, string>,
): OperatingEntry {
  const debtId = inferDebtId(event.label, debtRecords);

  return {
    amountUsd: event.amount,
    category: event.category,
    confidence: event.confidence,
    date: event.date,
    ...(debtId === undefined ? {} : { debtId }),
    id: event.id,
    kind: resolveEntryKind(event),
    label: event.label,
    ...(event.notes === undefined ? {} : { notes: event.notes }),
    source: event.source,
    sourceKind: 'seed',
    status: 'planned',
    weekId: eventWeekIdMap.get(event.id) ?? '',
  };
}

function buildRecurringTemplate(
  obligation: ScheduledObligation,
  debtRecords: RealDebtRecord[],
): OperatingRecurringTemplate {
  const debtId = inferDebtId(obligation.label, debtRecords);
  const scheduledDay = Number(obligation.scheduledDate.split('-')[2] ?? '1');

  return {
    amountUsd: obligation.expectedAmount,
    cadence: obligation.cadence,
    category: obligation.category,
    confidence: obligation.confidence,
    ...(debtId === undefined ? {} : { debtId }),
    id: `${obligation.id}-template`,
    label: obligation.label,
    ...(obligation.notes === undefined ? {} : { notes: obligation.notes }),
    scheduledDay,
    source: obligation.source,
  };
}

function buildRecurringQueueItem(
  obligation: ScheduledObligation,
  templateId: string,
  debtRecords: RealDebtRecord[],
  eventWeekIdMap: Map<string, string>,
): OperatingRecurringQueueItem {
  const debtId = inferDebtId(obligation.label, debtRecords);

  return {
    amountUsd: obligation.expectedAmount,
    cadence: obligation.cadence,
    category: obligation.category,
    confidence: obligation.confidence,
    ...(debtId === undefined ? {} : { debtId }),
    entryId: obligation.id,
    id: `${obligation.id}-queue`,
    label: obligation.label,
    ...(obligation.notes === undefined ? {} : { notes: obligation.notes }),
    scheduledDate: obligation.scheduledDate,
    source: obligation.source,
    sourceKind: 'seed',
    status: 'incorporated',
    templateId,
    weekId: eventWeekIdMap.get(obligation.id) ?? '',
  };
}

function buildDebtTrack(debtRecord: RealDebtRecord, priority: number): DebtTrack {
  return {
    apr: debtRecord.apr ?? 0,
    aprAssumptionDecimal: debtRecord.apr ?? null,
    aprSourceContext: {},
    balanceUsd: debtRecord.balance,
    confidence: debtRecord.confidence,
    creditor: debtRecord.creditor,
    id: debtRecord.id,
    isExcludedFromPayoffLine: debtRecord.id === 'debt-america-first-auto',
    label: debtRecord.label,
    ...(debtRecord.minimumPayment === undefined ? {} : { minimumPaymentUsd: debtRecord.minimumPayment }),
    ...(debtRecord.notes === undefined ? {} : { notes: debtRecord.notes }),
    priority,
    source: debtRecord.source,
  };
}

export function buildOperatingMonthFromSnapshot(snapshot: RealDataSnapshot): OperatingMonth {
  const { eventWeekIdMap, monthId, weeks } = buildWeekMap(snapshot);
  const calendar = buildCashFlowCalendar(snapshot);
  const entries = calendar.events.map((event) => buildOperatingEntry(event, snapshot.debtRecords, eventWeekIdMap));
  const recurringTemplates = snapshot.scheduledObligations
    .filter((obligation) => obligation.cadence !== 'oneTime')
    .map((obligation) => buildRecurringTemplate(obligation, snapshot.debtRecords));
  const recurringQueue = snapshot.scheduledObligations
      .filter((obligation) => obligation.cadence !== 'oneTime')
      .map((obligation) => {
        return buildRecurringQueueItem(obligation, `${obligation.id}-template`, snapshot.debtRecords, eventWeekIdMap);
      });
  const debtTracks = snapshot.debtRecords.map((debtRecord, index) => buildDebtTrack(debtRecord, index + 1));

  return {
    currencyCode: 'USD',
    debtPaymentEvents: [],
    debtTracks,
    entries,
    id: monthId,
    month: snapshot.month,
    recurringQueue,
    recurringTemplates,
    seededFromMonthId: null,
    statusHistory: [],
    weeks,
  };
}
