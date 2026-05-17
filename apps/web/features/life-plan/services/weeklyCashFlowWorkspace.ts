import type {
  BuildWeeklyCashFlowWorkspaceOptions,
  CashFlowWorkspaceSummary,
  CashFlowWorkspaceWeek,
  CashFlowWorkspaceWeekEvent,
  FinancialDataConfidence,
  OperatingEntry,
  OperatingMonth,
  ReviewQueueItem,
  SafeExtraPaymentSummary,
  WeeklyCashFlowWorkspace,
} from '../types';

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function isReviewConfidence(confidence: FinancialDataConfidence): boolean {
  return confidence === 'estimated' || confidence === 'needsReview';
}

function getConfidenceRank(confidence: FinancialDataConfidence): number {
  if (confidence === 'needsReview') {
    return 0;
  }

  if (confidence === 'estimated') {
    return 1;
  }

  return 2;
}

function getKindRank(kind: ReviewQueueItem['kind']): number {
  if (kind === 'debt') {
    return 0;
  }

  return 1;
}

function getDirection(entry: OperatingEntry): CashFlowWorkspaceWeekEvent['direction'] {
  return entry.kind === 'income' ? 'inflow' : 'outflow';
}

function isProjectedEntry(entry: OperatingEntry): boolean {
  return entry.status !== 'skipped';
}

function buildWeekEvent(entry: OperatingEntry): CashFlowWorkspaceWeekEvent {
  return {
    amount: entry.amountUsd,
    category: entry.category,
    confidence: entry.confidence,
    date: entry.date,
    ...(entry.debtId === undefined ? {} : { debtId: entry.debtId }),
    direction: getDirection(entry),
    id: entry.id,
    isReviewRequired: isReviewConfidence(entry.confidence),
    kind: entry.kind,
    label: entry.label,
    ...(entry.notes === undefined ? {} : { notes: entry.notes }),
    currencyCode: 'USD',
    sourceKind: entry.sourceKind,
    sourceLabel: entry.source.label,
    status: entry.status,
  };
}

function buildWorkspaceWeek(month: OperatingMonth, weekId: string, runningBalance: number): CashFlowWorkspaceWeek {
  const week = month.weeks.find((candidateWeek) => candidateWeek.id === weekId);
  const entries = month.entries
    .filter((entry) => entry.weekId === weekId)
    .sort((leftEntry, rightEntry) => leftEntry.date.localeCompare(rightEntry.date));
  const visibleEntries = entries.filter(isProjectedEntry);
  const totalInflow = roundCurrency(
    visibleEntries
      .filter((entry) => entry.kind === 'income')
      .reduce((sum, entry) => sum + entry.amountUsd, 0),
  );
  const totalOutflow = roundCurrency(
    visibleEntries
      .filter((entry) => entry.kind !== 'income')
      .reduce((sum, entry) => sum + entry.amountUsd, 0),
  );
  const endingBalance = roundCurrency(runningBalance + totalInflow - totalOutflow);
  const events = entries.map(buildWeekEvent);

  return {
    endingBalance,
    estimatedItemCount: events.filter((event) => event.confidence === 'estimated').length,
    eventCount: events.length,
    events,
    freeMargin: roundCurrency(totalInflow - totalOutflow),
    id: weekId,
    label: week?.label ?? '',
    reviewItemCount: events.filter((event) => event.isReviewRequired).length,
    startingBalance: runningBalance,
    totalInflow,
    totalOutflow,
    weekEndDate: week?.endDate ?? '',
    weekStartDate: week?.startDate ?? '',
  };
}

function buildReviewQueue(month: OperatingMonth): ReviewQueueItem[] {
  const entryItems = month.entries
    .filter((entry) => isReviewConfidence(entry.confidence))
    .map((entry) => {
      const weekStartDate = month.weeks.find((week) => week.id === entry.weekId)?.startDate;

      return {
        amount: entry.amountUsd,
        confidence: entry.confidence,
        currencyCode: 'USD' as const,
        eventCategory: entry.category,
        id: entry.id,
        kind: 'event' as const,
        label: entry.label,
        ...(entry.notes === undefined ? {} : { notes: entry.notes }),
        reason:
          entry.confidence === 'needsReview'
            ? 'This entry still needs review before the weekly projection is fully trusted.'
            : 'This entry is still estimated and should be confirmed.',
        sourceLabel: entry.source.label,
        ...(weekStartDate === undefined ? {} : { weekStartDate }),
      };
    });
  const debtItems = month.debtTracks
    .filter((debtTrack) => isReviewConfidence(debtTrack.confidence))
    .map((debtTrack) => {
      return {
        amount: debtTrack.balanceUsd,
        confidence: debtTrack.confidence,
        currencyCode: 'USD' as const,
        id: debtTrack.id,
        kind: 'debt' as const,
        label: `${debtTrack.creditor} · ${debtTrack.label}`,
        ...(debtTrack.notes === undefined ? {} : { notes: debtTrack.notes }),
        reason:
          debtTrack.confidence === 'needsReview'
            ? 'Debt details still need review before extra-payment guidance is trusted.'
            : 'Debt details are still estimated and should be validated.',
        sourceLabel: debtTrack.source.label,
      };
    });

  return [...debtItems, ...entryItems].sort((leftItem, rightItem) => {
    const confidenceRank = getConfidenceRank(leftItem.confidence) - getConfidenceRank(rightItem.confidence);

    if (confidenceRank !== 0) {
      return confidenceRank;
    }

    const kindRank = getKindRank(leftItem.kind) - getKindRank(rightItem.kind);

    if (kindRank !== 0) {
      return kindRank;
    }

    return leftItem.label.localeCompare(rightItem.label);
  });
}

function resolveAsOfWeekStartDate(weeks: CashFlowWorkspaceWeek[], selectedWeekId: string | null): string {
  const matchedWeek = weeks.find((week) => week.id === selectedWeekId);

  return matchedWeek?.weekStartDate ?? weeks[0]?.weekStartDate ?? '';
}

function buildSafeExtraPaymentSummary(
  weeks: CashFlowWorkspaceWeek[],
  reviewQueue: ReviewQueueItem[],
  selectedWeekId: string | null,
): SafeExtraPaymentSummary {
  const asOfWeekStartDate = resolveAsOfWeekStartDate(weeks, selectedWeekId);
  const currentWeekIndex = weeks.findIndex((week) => week.weekStartDate === asOfWeekStartDate);
  const remainingWeeks = currentWeekIndex >= 0 ? weeks.slice(currentWeekIndex) : weeks;
  const minimumFutureEndingBalance = roundCurrency(
    remainingWeeks.reduce((minimumBalance, week) => {
      return Math.min(minimumBalance, week.endingBalance);
    }, remainingWeeks[0]?.endingBalance ?? 0),
  );
  const blockingReasons: string[] = [];
  const hasNeedsReviewDebt = reviewQueue.some((item) => {
    return item.kind === 'debt' && item.confidence === 'needsReview';
  });
  const hasNeedsReviewDebtPayment = reviewQueue.some((item) => {
    return item.kind === 'event' && item.eventCategory === 'debtPayment' && item.confidence === 'needsReview';
  });

  if (hasNeedsReviewDebt || hasNeedsReviewDebtPayment) {
    blockingReasons.push('Debt-related review items still block safe extra payment guidance.');
  }

  const hasZeroDebtPayment = weeks.some((week) => {
    return week.events.some((event) => event.category === 'debtPayment' && event.amount === 0 && event.status !== 'skipped');
  });

  if (hasZeroDebtPayment) {
    blockingReasons.push('At least one planned debt payment still has a zero placeholder amount.');
  }

  const confidence: FinancialDataConfidence =
    blockingReasons.length > 0
      ? 'needsReview'
      : reviewQueue.some((item) => item.confidence === 'estimated')
        ? 'estimated'
        : 'verified';
  const amount = blockingReasons.length > 0 ? 0 : Math.max(minimumFutureEndingBalance, 0);

  return {
    amount,
    basedOnWeekStartDate: asOfWeekStartDate,
    blockingReasons,
    confidence,
    currencyCode: 'USD',
    explanation:
      blockingReasons.length > 0
        ? 'Safe extra payment stays at zero until review blockers are cleared.'
        : 'Safe extra payment equals the lowest projected ending balance across the remaining weeks.',
    minimumFutureEndingBalance,
  };
}

function buildWorkspaceSummary(
  weeks: CashFlowWorkspaceWeek[],
  reviewQueue: ReviewQueueItem[],
): CashFlowWorkspaceSummary {
  return {
    currencyCode: 'USD',
    freeMargin: roundCurrency(weeks.reduce((sum, week) => sum + week.freeMargin, 0)),
    reviewItemCount: reviewQueue.length,
    totalEvents: weeks.reduce((sum, week) => sum + week.eventCount, 0),
    totalInflow: roundCurrency(weeks.reduce((sum, week) => sum + week.totalInflow, 0)),
    totalOutflow: roundCurrency(weeks.reduce((sum, week) => sum + week.totalOutflow, 0)),
    totalWeeks: weeks.length,
    validationIssueCount: 0,
  };
}

export function buildWeeklyCashFlowWorkspace(
  month: OperatingMonth,
  options: BuildWeeklyCashFlowWorkspaceOptions = {},
): WeeklyCashFlowWorkspace {
  const selectedWeekId = options.asOfWeekId ?? options.selectedWeekId ?? null;
  const weeks = month.weeks.reduce<CashFlowWorkspaceWeek[]>((workspaceWeeks, week) => {
    const previousEndingBalance = workspaceWeeks[workspaceWeeks.length - 1]?.endingBalance ?? 0;

    return [...workspaceWeeks, buildWorkspaceWeek(month, week.id, previousEndingBalance)];
  }, []);
  const reviewQueue = buildReviewQueue(month);

  return {
    asOfWeekStartDate: resolveAsOfWeekStartDate(weeks, selectedWeekId),
    currencyCode: 'USD',
    reviewQueue,
    safeExtraPayment: buildSafeExtraPaymentSummary(weeks, reviewQueue, selectedWeekId),
    summary: buildWorkspaceSummary(weeks, reviewQueue),
    weeks,
  };
}
