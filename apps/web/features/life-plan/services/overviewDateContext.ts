import { formatOperatingMonthLabel } from './operatingRecurringQueue';
import type { OperatingMonth, OperatingOverviewDateContext } from '../types';

interface ResolveOperatingOverviewDateContextInput {
  activeMonth: OperatingMonth;
  currentMonth: OperatingMonth | null;
  todayIsoDate: string;
}

function resolveWeekId(month: OperatingMonth, todayIsoDate: string): string | null {
  const matchedWeek = month.weeks.find((week) => todayIsoDate >= week.startDate && todayIsoDate <= week.endDate);

  return matchedWeek?.id ?? month.weeks[0]?.id ?? null;
}

function resolveWeekLabel(month: OperatingMonth, overviewWeekId: string | null): string {
  if (overviewWeekId === null) {
    return 'No current week loaded';
  }

  return month.weeks.find((week) => week.id === overviewWeekId)?.label ?? 'No current week loaded';
}

export function getCurrentUtcIsoDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function resolveOperatingOverviewDateContext({
  activeMonth,
  currentMonth,
  todayIsoDate,
}: ResolveOperatingOverviewDateContextInput): OperatingOverviewDateContext {
  const resolvedMonth = currentMonth ?? activeMonth;
  const isCurrentMonthAvailable = currentMonth !== null;
  const overviewWeekId = isCurrentMonthAvailable ? resolveWeekId(resolvedMonth, todayIsoDate) : resolvedMonth.weeks[0]?.id ?? null;

  return {
    freshnessLabel: isCurrentMonthAvailable
      ? `Today-aware through ${todayIsoDate}`
      : `Current month is not loaded yet · showing ${formatOperatingMonthLabel(resolvedMonth.month)} instead`,
    isCurrentMonthAvailable,
    overviewMonthId: resolvedMonth.id,
    overviewMonthLabel: formatOperatingMonthLabel(resolvedMonth.month),
    overviewWeekId,
    overviewWeekLabel: resolveWeekLabel(resolvedMonth, overviewWeekId),
    todayIsoDate,
  };
}
