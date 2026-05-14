import type { CashFlowEvent, CurrencyCode, WeeklyCashFlowCheckpoint } from '../types';
import type { DeclaredCashFlowTotals, RealDataSnapshot, ScheduledObligation } from '../realDataSnapshot';

interface IndexedCashFlowEvent {
  event: CashFlowEvent;
  index: number;
}

export interface CashFlowTotals {
  currencyCode: CurrencyCode;
  freeMargin: number;
  totalInflow: number;
  totalOutflow: number;
}

export interface CashFlowValidationIssue {
  computedValue: number;
  currencyCode: CurrencyCode;
  declaredValue: number;
  delta: number;
  field: 'freeMargin' | 'totalIncome' | 'totalOutflow';
  id: string;
  message: string;
  sourceLabel: string;
}

export interface CashFlowCalendarSummary {
  currencyCode: CurrencyCode;
  events: CashFlowEvent[];
  totals: CashFlowTotals;
  validationIssues: CashFlowValidationIssue[];
  weeklyCheckpoints: WeeklyCashFlowCheckpoint[];
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseIsoDate(date: string): Date {
  const [yearText, monthText, dayText] = date.split('-');

  if (yearText === undefined || monthText === undefined || dayText === undefined) {
    throw new Error(`Invalid ISO date: ${date}`);
  }

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  return new Date(Date.UTC(year, month - 1, day));
}

function formatIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date.getTime());
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function getWeekStartDate(date: string): string {
  const parsedDate = parseIsoDate(date);
  const dayOfWeek = parsedDate.getUTCDay();
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  // The spreadsheet behaves like a weekly operating calendar, so checkpoints normalize to Monday-Sunday windows.
  return formatIsoDate(addDays(parsedDate, offsetToMonday));
}

function createOutflowEvent(obligation: ScheduledObligation): CashFlowEvent {
  return {
    id: obligation.id,
    date: obligation.scheduledDate,
    label: obligation.label,
    direction: 'outflow',
    category: obligation.category,
    amount: obligation.expectedAmount,
    currencyCode: obligation.currencyCode,
    confidence: obligation.confidence,
    source: obligation.source,
    ...(obligation.notes === undefined ? {} : { notes: obligation.notes }),
  };
}

export function sortCashFlowEvents(events: CashFlowEvent[]): CashFlowEvent[] {
  return events
    .map((event, index) => ({ event, index }))
    .sort((leftEvent, rightEvent) => {
      if (leftEvent.event.date !== rightEvent.event.date) {
        return leftEvent.event.date.localeCompare(rightEvent.event.date);
      }

      return leftEvent.index - rightEvent.index;
    })
    .map((entry) => entry.event);
}

export function buildCashFlowEvents(snapshot: RealDataSnapshot): CashFlowEvent[] {
  return sortCashFlowEvents([
    ...snapshot.incomeEvents,
    ...snapshot.scheduledObligations.map(createOutflowEvent),
  ]);
}

export function calculateCashFlowTotals(events: CashFlowEvent[]): CashFlowTotals {
  const startingTotals: CashFlowTotals = {
    currencyCode: events[0]?.currencyCode ?? 'USD',
    freeMargin: 0,
    totalInflow: 0,
    totalOutflow: 0,
  };

  const totals = events.reduce((summary, event) => {
    if (event.direction === 'inflow') {
      return {
        ...summary,
        totalInflow: roundCurrency(summary.totalInflow + event.amount),
      };
    }

    return {
      ...summary,
      totalOutflow: roundCurrency(summary.totalOutflow + event.amount),
    };
  }, startingTotals);

  return {
    ...totals,
    freeMargin: roundCurrency(totals.totalInflow - totals.totalOutflow),
  };
}

export function buildWeeklyCashFlowCheckpoints(
  events: CashFlowEvent[],
  startingBalance: number = 0,
): WeeklyCashFlowCheckpoint[] {
  if (events.length === 0) {
    return [];
  }

  const sortedEvents = sortCashFlowEvents(events);
  const eventsByWeekStart = new Map<string, IndexedCashFlowEvent[]>();

  sortedEvents.forEach((event, index) => {
    const weekStartDate = getWeekStartDate(event.date);
    const existingWeekEvents = eventsByWeekStart.get(weekStartDate) ?? [];
    existingWeekEvents.push({ event, index });
    eventsByWeekStart.set(weekStartDate, existingWeekEvents);
  });

  const firstEvent = sortedEvents[0];
  const lastEvent = sortedEvents[sortedEvents.length - 1];

  if (firstEvent === undefined || lastEvent === undefined) {
    return [];
  }

  const firstWeekStartDate = getWeekStartDate(firstEvent.date);
  const lastWeekStartDate = getWeekStartDate(lastEvent.date);
  const checkpoints: WeeklyCashFlowCheckpoint[] = [];
  let runningBalance = roundCurrency(startingBalance);
  let currentWeekDate = parseIsoDate(firstWeekStartDate);
  const finalWeekDate = parseIsoDate(lastWeekStartDate);

  while (currentWeekDate.getTime() <= finalWeekDate.getTime()) {
    const weekStartDate = formatIsoDate(currentWeekDate);
    const weekEntries = eventsByWeekStart.get(weekStartDate) ?? [];
    const weekEvents = weekEntries
      .sort((leftEvent, rightEvent) => leftEvent.index - rightEvent.index)
      .map((entry) => entry.event);
    const totalInflow = roundCurrency(
      weekEvents
        .filter((event) => event.direction === 'inflow')
        .reduce((sum, event) => sum + event.amount, 0),
    );
    const totalOutflow = roundCurrency(
      weekEvents
        .filter((event) => event.direction === 'outflow')
        .reduce((sum, event) => sum + event.amount, 0),
    );
    const endingBalance = roundCurrency(runningBalance + totalInflow - totalOutflow);

    checkpoints.push({
      id: `checkpoint-${weekStartDate}`,
      weekStartDate,
      weekEndDate: formatIsoDate(addDays(currentWeekDate, 6)),
      startingBalance: runningBalance,
      totalInflow,
      totalOutflow,
      endingBalance,
      freeMargin: roundCurrency(totalInflow - totalOutflow),
      eventIds: weekEvents.map((event) => event.id),
    });

    runningBalance = endingBalance;
    currentWeekDate = addDays(currentWeekDate, 7);
  }

  return checkpoints;
}

export function validateDeclaredCashFlowTotals(
  totals: CashFlowTotals,
  declaredTotals: DeclaredCashFlowTotals,
): CashFlowValidationIssue[] {
  const comparisons: Array<{
    computedValue: number;
    declaredValue: number;
    field: CashFlowValidationIssue['field'];
  }> = [
    {
      field: 'totalIncome',
      declaredValue: declaredTotals.totalIncome,
      computedValue: totals.totalInflow,
    },
    {
      field: 'totalOutflow',
      declaredValue: declaredTotals.totalOutflow,
      computedValue: totals.totalOutflow,
    },
    {
      field: 'freeMargin',
      declaredValue: declaredTotals.freeMargin,
      computedValue: totals.freeMargin,
    },
  ];

  return comparisons.flatMap((comparison) => {
    const delta = roundCurrency(comparison.computedValue - comparison.declaredValue);

    if (delta === 0) {
      return [];
    }

    return [
      {
        id: `declared-total-mismatch-${comparison.field}`,
        field: comparison.field,
        declaredValue: comparison.declaredValue,
        computedValue: comparison.computedValue,
        delta,
        currencyCode: declaredTotals.currencyCode,
        sourceLabel: declaredTotals.source.label,
        // Source totals stay authoritative for review; mismatches surface as issues instead of silently mutating the baseline.
        message: `${comparison.field} differs from declared source totals by ${delta}.`,
      },
    ];
  });
}

export function buildCashFlowCalendar(
  snapshot: RealDataSnapshot,
  startingBalance: number = 0,
): CashFlowCalendarSummary {
  const events = buildCashFlowEvents(snapshot);
  const totals = calculateCashFlowTotals(events);

  return {
    currencyCode: snapshot.currencyCode,
    events,
    totals,
    validationIssues: validateDeclaredCashFlowTotals(totals, snapshot.declaredTotals),
    weeklyCheckpoints: buildWeeklyCashFlowCheckpoints(events, startingBalance),
  };
}
