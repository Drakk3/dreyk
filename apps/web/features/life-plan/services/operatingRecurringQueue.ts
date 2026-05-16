import { createOperatingEntry } from './operatingEntryMutations';
import type { OperatingMonth, OperatingRecurringQueueItem, OperatingRecurringTemplate, OperatingWeek } from '../types';

function parseMonth(month: string): { monthIndex: number; year: number } {
  const [yearText, monthText] = month.split('-');
  const year = Number(yearText);
  const monthIndex = Number(monthText);

  if (!Number.isInteger(year) || !Number.isInteger(monthIndex)) {
    throw new Error(`Invalid operating month: ${month}`);
  }

  return { monthIndex, year };
}

function formatMonth(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex).padStart(2, '0')}`;
}

function formatIsoDate(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
}

function parseIsoDate(date: string): Date {
  const [yearText, monthText, dayText] = date.split('-');
  const year = Number(yearText);
  const monthIndex = Number(monthText);
  const day = Number(dayText);

  return new Date(Date.UTC(year, monthIndex - 1, day));
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date.getTime());
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function resolveWeekStart(date: Date): Date {
  const dayOfWeek = date.getUTCDay();
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  return addDays(date, offsetToMonday);
}

function formatDate(date: Date): string {
  return formatIsoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

function createMonthId(month: string): string {
  return `operating-month-${month}`;
}

function createWeekId(monthId: string, index: number, startDate: string): string {
  return `${monthId}-week-${index + 1}-${startDate}`;
}

function createWeeks(month: string): OperatingWeek[] {
  const { monthIndex, year } = parseMonth(month);
  const firstDate = new Date(Date.UTC(year, monthIndex - 1, 1));
  const lastDate = new Date(Date.UTC(year, monthIndex - 1, getDaysInMonth(year, monthIndex)));
  const firstWeekStart = resolveWeekStart(firstDate);
  const weeks: OperatingWeek[] = [];
  let weekStart = firstWeekStart;
  const monthId = createMonthId(month);
  let index = 0;

  while (weekStart.getTime() <= lastDate.getTime()) {
    const startDate = formatDate(weekStart);
    const endDate = formatDate(addDays(weekStart, 6));

    weeks.push({
      entryIds: [],
      endDate,
      id: createWeekId(monthId, index, startDate),
      index: index + 1,
      label: `${startDate} → ${endDate}`,
      monthId,
      startDate,
    });

    weekStart = addDays(weekStart, 7);
    index += 1;
  }

  return weeks;
}

function resolveWeekId(weeks: OperatingWeek[], scheduledDate: string): string {
  const matchedWeek = weeks.find((week) => scheduledDate >= week.startDate && scheduledDate <= week.endDate);

  return matchedWeek?.id ?? weeks[0]?.id ?? '';
}

function buildMonthlyDates(template: OperatingRecurringTemplate, month: string): string[] {
  const { monthIndex, year } = parseMonth(month);
  const day = Math.min(template.scheduledDay, getDaysInMonth(year, monthIndex));

  return [formatIsoDate(year, monthIndex, day)];
}

function buildRepeatedDates(
  template: OperatingRecurringTemplate,
  month: string,
  intervalDays: number,
): string[] {
  const { monthIndex, year } = parseMonth(month);
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const dates: string[] = [];

  for (let day = template.scheduledDay; day <= daysInMonth; day += intervalDays) {
    dates.push(formatIsoDate(year, monthIndex, day));
  }

  return dates;
}

function buildScheduledDates(template: OperatingRecurringTemplate, month: string): string[] {
  if (template.cadence === 'monthly') {
    return buildMonthlyDates(template, month);
  }

  if (template.cadence === 'biweekly') {
    return buildRepeatedDates(template, month, 14);
  }

  if (template.cadence === 'weekly') {
    return buildRepeatedDates(template, month, 7);
  }

  return [];
}

function buildQueueItem(
  monthId: string,
  template: OperatingRecurringTemplate,
  scheduledDate: string,
  weekId: string,
): OperatingRecurringQueueItem {
  return {
    amountUsd: template.amountUsd,
    cadence: template.cadence,
    category: template.category,
    confidence: template.confidence,
    ...(template.debtId === undefined ? {} : { debtId: template.debtId }),
    id: `${monthId}-${template.id}-${scheduledDate}`,
    label: template.label,
    ...(template.notes === undefined ? {} : { notes: template.notes }),
    scheduledDate,
    source: template.source,
    sourceKind: 'generated',
    status: 'pending',
    templateId: template.id,
    weekId,
  };
}

export function buildOperatingMonthFromRecurringTemplates(baseMonth: OperatingMonth, month: string): OperatingMonth {
  const monthId = createMonthId(month);
  const weeks = createWeeks(month);
  const recurringQueue = baseMonth.recurringTemplates.flatMap((template) => {
    return buildScheduledDates(template, month).map((scheduledDate) => {
      return buildQueueItem(monthId, template, scheduledDate, resolveWeekId(weeks, scheduledDate));
    });
  });

  return {
    currencyCode: 'USD',
    debtTracks: baseMonth.debtTracks,
    entries: [],
    id: monthId,
    month,
    recurringQueue,
    recurringTemplates: baseMonth.recurringTemplates,
    statusHistory: [],
    weeks,
  };
}

export function incorporateRecurringQueueItem(month: OperatingMonth, queueItemId: string): OperatingMonth {
  const queueItem = month.recurringQueue.find((item) => item.id === queueItemId);

  if (queueItem === undefined || queueItem.status === 'incorporated') {
    return month;
  }

  const nextMonth = createOperatingEntry(month, {
    amountUsd: queueItem.amountUsd,
    category: queueItem.category,
    confidence: queueItem.confidence,
    date: queueItem.scheduledDate,
    ...(queueItem.debtId === undefined ? {} : { debtId: queueItem.debtId }),
    kind: queueItem.category === 'debtPayment' ? 'debt' : 'expense',
    label: queueItem.label,
    ...(queueItem.notes === undefined ? {} : { notes: queueItem.notes }),
    source: queueItem.source,
    sourceKind: 'generated',
    status: 'planned',
  });
  const createdEntry = nextMonth.entries.find((entry) => {
    return (
      entry.date === queueItem.scheduledDate &&
      entry.label === queueItem.label &&
      entry.amountUsd === queueItem.amountUsd &&
      entry.sourceKind === 'generated'
    );
  });

  return {
    ...nextMonth,
    recurringQueue: nextMonth.recurringQueue.map((item) => {
      if (item.id !== queueItemId) {
        return item;
      }

      return {
        ...item,
        ...(createdEntry === undefined ? {} : { entryId: createdEntry.id }),
        status: 'incorporated',
      };
    }),
  };
}

export function shiftOperatingMonth(month: string, offset: number): string {
  const { monthIndex, year } = parseMonth(month);
  const baseDate = new Date(Date.UTC(year, monthIndex - 1 + offset, 1));

  return formatMonth(baseDate.getUTCFullYear(), baseDate.getUTCMonth() + 1);
}

export function formatOperatingMonthLabel(month: string): string {
  const parsedDate = parseIsoDate(`${month}-01`);

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsedDate);
}
