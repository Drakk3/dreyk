import type { CashFlowCalendarSummary, CashFlowValidationIssue } from './cashFlowCalendar';
import { buildCashFlowCalendar } from './cashFlowCalendar';
import type { RealDataSnapshot, RealDebtRecord } from '../realDataSnapshot';
import type {
  CashFlowEvent,
  CashFlowWorkspaceSummary,
  CashFlowWorkspaceWeek,
  CashFlowWorkspaceWeekEvent,
  FinancialDataConfidence,
  ReviewQueueItem,
  SafeExtraPaymentSummary,
  WeeklyCashFlowCheckpoint,
  WeeklyCashFlowWorkspace,
} from '../types';

interface ReviewEventCandidate {
  event: CashFlowEvent;
  weekStartDate: string;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatWeekLabel(weekStartDate: string, weekEndDate: string): string {
  return `${weekStartDate} → ${weekEndDate}`;
}

function isReviewConfidence(confidence: FinancialDataConfidence): boolean {
  return confidence === 'needsReview' || confidence === 'estimated';
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
  if (kind === 'validation') {
    return 0;
  }

  if (kind === 'debt') {
    return 1;
  }

  return 2;
}

function buildWeekEvent(event: CashFlowEvent, needsReviewItemIds: Set<string>): CashFlowWorkspaceWeekEvent {
  return {
    id: event.id,
    date: event.date,
    label: event.label,
    direction: event.direction,
    category: event.category,
    amount: event.amount,
    currencyCode: event.currencyCode,
    confidence: event.confidence,
    isReviewRequired: needsReviewItemIds.has(event.id) || isReviewConfidence(event.confidence),
    ...(event.notes === undefined ? {} : { notes: event.notes }),
    sourceLabel: event.source.label,
  };
}

function buildWorkspaceWeek(
  checkpoint: WeeklyCashFlowCheckpoint,
  eventMap: Map<string, CashFlowEvent>,
  needsReviewItemIds: Set<string>,
): CashFlowWorkspaceWeek {
  const events = checkpoint.eventIds.flatMap((eventId) => {
    const event = eventMap.get(eventId);

    if (event === undefined) {
      return [];
    }

    return [buildWeekEvent(event, needsReviewItemIds)];
  });
  const reviewItemCount = events.filter((event) => event.isReviewRequired).length;
  const estimatedItemCount = events.filter((event) => event.confidence === 'estimated').length;

  return {
    id: checkpoint.id,
    label: formatWeekLabel(checkpoint.weekStartDate, checkpoint.weekEndDate),
    weekStartDate: checkpoint.weekStartDate,
    weekEndDate: checkpoint.weekEndDate,
    startingBalance: checkpoint.startingBalance,
    totalInflow: checkpoint.totalInflow,
    totalOutflow: checkpoint.totalOutflow,
    freeMargin: checkpoint.freeMargin,
    endingBalance: checkpoint.endingBalance,
    eventCount: events.length,
    estimatedItemCount,
    reviewItemCount,
    events,
  };
}

function buildReviewEventCandidates(
  calendar: CashFlowCalendarSummary,
  needsReviewItemIds: Set<string>,
): ReviewEventCandidate[] {
  return calendar.weeklyCheckpoints.flatMap((checkpoint) => {
    return checkpoint.eventIds.flatMap((eventId) => {
      const event = calendar.events.find((calendarEvent) => calendarEvent.id === eventId);

      if (event === undefined) {
        return [];
      }

      if (!needsReviewItemIds.has(event.id) && !isReviewConfidence(event.confidence)) {
        return [];
      }

      return [{ event, weekStartDate: checkpoint.weekStartDate }];
    });
  });
}

function buildEventReviewItem(candidate: ReviewEventCandidate): ReviewQueueItem {
  return {
    id: candidate.event.id,
    label: candidate.event.label,
    kind: 'event',
    confidence: candidate.event.confidence,
    reason:
      candidate.event.confidence === 'needsReview'
        ? 'This calendar event still needs manual review before treating the projection as fully trusted.'
        : 'This calendar event is still estimated and should be confirmed against the source document.',
    sourceLabel: candidate.event.source.label,
    amount: candidate.event.amount,
    currencyCode: candidate.event.currencyCode,
    eventCategory: candidate.event.category,
    weekStartDate: candidate.weekStartDate,
    ...(candidate.event.notes === undefined ? {} : { notes: candidate.event.notes }),
  };
}

function buildDebtReviewItem(debt: RealDebtRecord): ReviewQueueItem {
  return {
    id: debt.id,
    label: `${debt.creditor} · ${debt.label}`,
    kind: 'debt',
    confidence: debt.confidence,
    reason:
      debt.confidence === 'needsReview'
        ? 'Debt source data still has unresolved review work that can affect payoff safety.'
        : 'Debt details are estimated and should be validated before relying on extra-payment guidance.',
    sourceLabel: debt.source.label,
    amount: debt.balance,
    currencyCode: debt.currencyCode,
    ...(debt.notes === undefined ? {} : { notes: debt.notes }),
  };
}

function buildValidationReviewItem(issue: CashFlowValidationIssue): ReviewQueueItem {
  return {
    id: issue.id,
    label: issue.field,
    kind: 'validation',
    confidence: 'needsReview',
    reason: issue.message,
    sourceLabel: issue.sourceLabel,
    amount: issue.delta,
    currencyCode: issue.currencyCode,
    notes: `Declared ${issue.field}: ${issue.declaredValue}; computed: ${issue.computedValue}.`,
  };
}

function buildReviewQueue(snapshot: RealDataSnapshot, calendar: CashFlowCalendarSummary): ReviewQueueItem[] {
  const needsReviewItemIds = new Set(snapshot.needsReviewItemIds);
  const eventItems = buildReviewEventCandidates(calendar, needsReviewItemIds).map(buildEventReviewItem);
  const debtItems = snapshot.debtRecords
    .filter((debt) => needsReviewItemIds.has(debt.id) || isReviewConfidence(debt.confidence))
    .map(buildDebtReviewItem);
  const validationItems = calendar.validationIssues.map(buildValidationReviewItem);

  return [...validationItems, ...debtItems, ...eventItems].sort((leftItem, rightItem) => {
    const confidenceRank = getConfidenceRank(leftItem.confidence) - getConfidenceRank(rightItem.confidence);

    if (confidenceRank !== 0) {
      return confidenceRank;
    }

    const kindRank = getKindRank(leftItem.kind) - getKindRank(rightItem.kind);

    if (kindRank !== 0) {
      return kindRank;
    }

    const leftWeekStartDate = leftItem.weekStartDate ?? '';
    const rightWeekStartDate = rightItem.weekStartDate ?? '';

    if (leftWeekStartDate !== rightWeekStartDate) {
      return leftWeekStartDate.localeCompare(rightWeekStartDate);
    }

    return leftItem.label.localeCompare(rightItem.label);
  });
}

function resolveAsOfWeekStartDate(checkpoints: WeeklyCashFlowCheckpoint[], asOfWeekStartDate?: string): string {
  if (checkpoints.length === 0) {
    return asOfWeekStartDate ?? '';
  }

  if (asOfWeekStartDate !== undefined) {
    const matchedCheckpoint = checkpoints.find((checkpoint) => checkpoint.weekStartDate === asOfWeekStartDate);

    if (matchedCheckpoint !== undefined) {
      return matchedCheckpoint.weekStartDate;
    }
  }

  return checkpoints[0]?.weekStartDate ?? '';
}

function resolveSafeExtraConfidence(
  reviewQueue: ReviewQueueItem[],
  basedOnWeekStartDate: string,
  blockingReasons: string[],
): FinancialDataConfidence {
  if (blockingReasons.length > 0) {
    return 'needsReview';
  }

  const hasEstimatedItems = reviewQueue.some((item) => {
    if (item.confidence !== 'estimated') {
      return false;
    }

    if (item.weekStartDate === undefined) {
      return true;
    }

    return item.weekStartDate >= basedOnWeekStartDate;
  });

  return hasEstimatedItems ? 'estimated' : 'verified';
}

function buildSafeExtraBlockingReasons(
  calendar: CashFlowCalendarSummary,
  reviewQueue: ReviewQueueItem[],
  basedOnWeekStartDate: string,
): string[] {
  const blockingReasons: string[] = [];

  if (calendar.validationIssues.length > 0) {
    blockingReasons.push('Declared source totals still disagree with the computed calendar totals.');
  }

  const hasNeedsReviewDebtRisk = reviewQueue.some((item) => {
    if (item.kind !== 'debt' && item.kind !== 'event') {
      return false;
    }

    if (item.kind === 'event' && item.weekStartDate !== undefined && item.weekStartDate < basedOnWeekStartDate) {
      return false;
    }

    const isDebtRelatedEvent = item.kind === 'event' && item.eventCategory === 'debtPayment';
    const isDebtItem = item.kind === 'debt';

    return item.confidence === 'needsReview' && (isDebtItem || isDebtRelatedEvent);
  });

  if (hasNeedsReviewDebtRisk) {
    blockingReasons.push('Debt-related items still need review, so safe extra payment stays locked at $0.00.');
  }

  const hasZeroAmountDebtPayment = calendar.events.some((event) => {
    return event.category === 'debtPayment' && event.amount === 0 && event.confidence === 'needsReview';
  });

  if (hasZeroAmountDebtPayment) {
    blockingReasons.push('At least one planned debt payment still has a zero placeholder amount.');
  }

  return blockingReasons;
}

function buildSafeExtraPaymentSummary(
  calendar: CashFlowCalendarSummary,
  reviewQueue: ReviewQueueItem[],
  basedOnWeekStartDate: string,
): SafeExtraPaymentSummary {
  const currentCheckpointIndex = calendar.weeklyCheckpoints.findIndex(
    (checkpoint) => checkpoint.weekStartDate === basedOnWeekStartDate,
  );
  const futureCheckpoints =
    currentCheckpointIndex >= 0
      ? calendar.weeklyCheckpoints.slice(currentCheckpointIndex + 1)
      : calendar.weeklyCheckpoints;
  const checkpointsToEvaluate = futureCheckpoints.length > 0 ? futureCheckpoints : calendar.weeklyCheckpoints;
  const minimumFutureEndingBalance = roundCurrency(
    checkpointsToEvaluate.reduce((minimumBalance, checkpoint) => {
      return Math.min(minimumBalance, checkpoint.endingBalance);
    }, checkpointsToEvaluate[0]?.endingBalance ?? 0),
  );
  const blockingReasons = buildSafeExtraBlockingReasons(calendar, reviewQueue, basedOnWeekStartDate);
  const confidence = resolveSafeExtraConfidence(reviewQueue, basedOnWeekStartDate, blockingReasons);
  const amount = blockingReasons.length > 0 ? 0 : Math.max(minimumFutureEndingBalance, 0);

  return {
    amount,
    basedOnWeekStartDate,
    blockingReasons,
    confidence,
    currencyCode: calendar.currencyCode,
    explanation:
      blockingReasons.length > 0
        ? 'Safe extra payment stays at zero until review blockers are cleared.'
        : 'Safe extra payment equals the lowest projected ending balance after upcoming obligations.',
    minimumFutureEndingBalance,
  };
}

function buildWorkspaceSummary(
  calendar: CashFlowCalendarSummary,
  weeks: CashFlowWorkspaceWeek[],
  reviewQueue: ReviewQueueItem[],
): CashFlowWorkspaceSummary {
  return {
    currencyCode: calendar.currencyCode,
    totalInflow: calendar.totals.totalInflow,
    totalOutflow: calendar.totals.totalOutflow,
    freeMargin: calendar.totals.freeMargin,
    totalWeeks: weeks.length,
    totalEvents: calendar.events.length,
    reviewItemCount: reviewQueue.length,
    validationIssueCount: calendar.validationIssues.length,
  };
}

export function buildWeeklyCashFlowWorkspace(
  snapshot: RealDataSnapshot,
  startingBalance?: number,
  asOfWeekStartDate?: string,
): WeeklyCashFlowWorkspace {
  const calendar = buildCashFlowCalendar(snapshot, startingBalance);
  const needsReviewItemIds = new Set(snapshot.needsReviewItemIds);
  const eventMap = new Map(calendar.events.map((event) => [event.id, event]));
  const weeks = calendar.weeklyCheckpoints.map((checkpoint) => {
    return buildWorkspaceWeek(checkpoint, eventMap, needsReviewItemIds);
  });
  const reviewQueue = buildReviewQueue(snapshot, calendar);
  const resolvedAsOfWeekStartDate = resolveAsOfWeekStartDate(calendar.weeklyCheckpoints, asOfWeekStartDate);
  const safeExtraPayment = buildSafeExtraPaymentSummary(calendar, reviewQueue, resolvedAsOfWeekStartDate);

  return {
    asOfWeekStartDate: resolvedAsOfWeekStartDate,
    currencyCode: calendar.currencyCode,
    reviewQueue,
    safeExtraPayment,
    summary: buildWorkspaceSummary(calendar, weeks, reviewQueue),
    weeks,
  };
}
