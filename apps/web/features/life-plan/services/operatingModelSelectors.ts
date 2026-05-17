import type {
  LifePlanSnapshot,
  OperatingCurrentWeekSummary,
  OperatingDebtCardViewModel,
  OperatingMonth,
  OperatingOverviewDateContext,
  OperatingOverviewModel,
  OperatingOverviewTotals,
  OperatingPayoffSummary,
  OperatingPendingWeekItem,
  OperatingRecurringPayDetails,
  SafeExtraPaymentSummary,
  WeeklyCashFlowWorkspace,
} from '../types';

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseIsoDate(date: string): Date {
  const [yearText, monthText, dayText] = date.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateLabel(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(parseIsoDate(date));
}

function formatCadenceLabel(cadence: 'weekly' | 'biweekly' | 'monthly' | 'oneTime'): string {
  if (cadence === 'weekly') {
    return 'Weekly';
  }

  if (cadence === 'biweekly') {
    return 'Every 2 weeks';
  }

  if (cadence === 'monthly') {
    return 'Monthly';
  }

  return 'One time';
}

function buildCurrentWeekSummary(workspace: WeeklyCashFlowWorkspace): OperatingCurrentWeekSummary {
  const currentWeek = workspace.weeks.find((week) => week.weekStartDate === workspace.asOfWeekStartDate) ?? workspace.weeks[0];

  if (currentWeek === undefined) {
    return {
      debtPaymentUsd: 0,
      doneEntryCount: 0,
      endingBalanceUsd: 0,
      freeMarginUsd: 0,
      label: 'No current week',
      plannedEntryCount: 0,
      skippedEntryCount: 0,
      startingBalanceUsd: 0,
      totalInflowUsd: 0,
      totalOutflowUsd: 0,
      weekEndDate: '',
      weekId: '',
      weekStartDate: '',
    };
  }

  const debtPaymentUsd = roundCurrency(
    currentWeek.events
      .filter((event) => event.category === 'debtPayment' && event.status !== 'skipped')
      .reduce((sum, event) => sum + event.amount, 0),
  );

  return {
    debtPaymentUsd,
    doneEntryCount: currentWeek.events.filter((event) => event.status === 'done').length,
    endingBalanceUsd: currentWeek.endingBalance,
    freeMarginUsd: currentWeek.freeMargin,
    label: currentWeek.label,
    plannedEntryCount: currentWeek.events.filter((event) => event.status === 'planned').length,
    skippedEntryCount: currentWeek.events.filter((event) => event.status === 'skipped').length,
    startingBalanceUsd: currentWeek.startingBalance,
    totalInflowUsd: currentWeek.totalInflow,
    totalOutflowUsd: currentWeek.totalOutflow,
    weekEndDate: currentWeek.weekEndDate,
    weekId: currentWeek.id,
    weekStartDate: currentWeek.weekStartDate,
  };
}

function buildOperatingOverviewTotals(
  month: OperatingMonth,
  safeExtraPayment: SafeExtraPaymentSummary,
): OperatingOverviewTotals {
  const activeEntries = month.entries.filter((entry) => entry.status !== 'skipped');
  const totalIncomeUsd = roundCurrency(
    activeEntries.filter((entry) => entry.kind === 'income').reduce((sum, entry) => sum + entry.amountUsd, 0),
  );
  const totalOutflowUsd = roundCurrency(
    activeEntries.filter((entry) => entry.kind !== 'income').reduce((sum, entry) => sum + entry.amountUsd, 0),
  );
  const debtPaymentUsd = roundCurrency(
    activeEntries.filter((entry) => entry.kind === 'debt').reduce((sum, entry) => sum + entry.amountUsd, 0),
  );
  const nonDebtExpenseUsd = roundCurrency(
    activeEntries.filter((entry) => entry.kind === 'expense').reduce((sum, entry) => sum + entry.amountUsd, 0),
  );
  const coreDebtBalanceUsd = roundCurrency(
    month.debtTracks
      .filter((debtTrack) => !debtTrack.isExcludedFromPayoffLine)
      .reduce((sum, debtTrack) => sum + debtTrack.balanceUsd, 0),
  );
  const excludedDebtBalanceUsd = roundCurrency(
    month.debtTracks
      .filter((debtTrack) => debtTrack.isExcludedFromPayoffLine)
      .reduce((sum, debtTrack) => sum + debtTrack.balanceUsd, 0),
  );

  return {
    coreDebtBalanceUsd,
    currencyCode: 'USD',
    debtPaymentUsd,
    excludedDebtBalanceUsd,
    netUsd: roundCurrency(totalIncomeUsd - totalOutflowUsd),
    nonDebtExpenseUsd,
    safeExtraPaymentUsd: safeExtraPayment.amount,
    totalIncomeUsd,
    totalOutflowUsd,
  };
}

function resolveAprDisplay(debtTrack: OperatingMonth['debtTracks'][number]): {
  aprContextLabel?: string;
  aprLabel: string;
} {
  const hasUsBankNuance = debtTrack.creditor === 'U.S. Bank' || debtTrack.notes?.includes('different rates') === true;

  if (hasUsBankNuance) {
    return {
      aprContextLabel: 'Promo purchases and cash advances still use different rates.',
      aprLabel: 'APR under review',
    };
  }

  if (debtTrack.apr <= 0) {
    return {
      aprLabel: 'APR to confirm',
    };
  }

  return {
    aprLabel: `${(debtTrack.apr * 100).toFixed(2)}% APR`,
  };
}

function resolveRecurringPay(
  month: OperatingMonth,
  debtId: string,
  plannedPaymentUsd: number,
  todayIsoDate: string,
): OperatingRecurringPayDetails {
  const queueItems = month.recurringQueue
    .filter((item) => item.debtId === debtId)
    .sort((leftItem, rightItem) => leftItem.scheduledDate.localeCompare(rightItem.scheduledDate));
  const nextQueueItem = queueItems.find((item) => item.scheduledDate >= todayIsoDate) ?? queueItems[0];

  if (nextQueueItem !== undefined) {
    return {
      amountUsd: nextQueueItem.amountUsd,
      cadenceLabel: formatCadenceLabel(nextQueueItem.cadence),
      label: `${formatCadenceLabel(nextQueueItem.cadence)} recurring pay`,
      scheduledDateLabel: `Next ${formatDateLabel(nextQueueItem.scheduledDate)}`,
    };
  }

  const plannedEntry = month.entries
    .filter((entry) => entry.kind === 'debt' && entry.debtId === debtId && entry.status !== 'skipped')
    .sort((leftEntry, rightEntry) => leftEntry.date.localeCompare(rightEntry.date))[0];

  if (plannedEntry !== undefined) {
    return {
      amountUsd: plannedEntry.amountUsd,
      cadenceLabel: 'This month',
      label: 'Recurring pay already scheduled',
      scheduledDateLabel: `Planned ${formatDateLabel(plannedEntry.date)}`,
    };
  }

  return {
    amountUsd: plannedPaymentUsd,
    cadenceLabel: 'To plan',
    label: 'Recurring pay still needs scheduling',
    scheduledDateLabel: 'No next date loaded',
  };
}

function buildDebtDescription(debtTrack: OperatingMonth['debtTracks'][number]): string {
  if (debtTrack.isExcludedFromPayoffLine) {
    return 'Visible as mobility context so work access stays protected while accelerated payoff guidance focuses elsewhere.';
  }

  if (debtTrack.notes !== undefined && debtTrack.notes.length > 0) {
    return debtTrack.notes;
  }

  return 'Tracked in USD so weekly execution can keep the debt payoff line honest.';
}

function buildDebtCards(
  month: OperatingMonth,
  todayIsoDate: string,
): OperatingDebtCardViewModel[] {
  return [...month.debtTracks]
    .sort((leftDebt, rightDebt) => {
      if (leftDebt.priority !== rightDebt.priority) {
        return leftDebt.priority - rightDebt.priority;
      }

      if (leftDebt.apr !== rightDebt.apr) {
        return rightDebt.apr - leftDebt.apr;
      }

      return leftDebt.balanceUsd - rightDebt.balanceUsd;
    })
    .map((debtTrack) => {
      const plannedPaymentUsd = roundCurrency(
        month.entries
          .filter((entry) => entry.debtId === debtTrack.id && entry.kind === 'debt' && entry.status !== 'skipped')
          .reduce((sum, entry) => sum + entry.amountUsd, 0),
      );
      const aprDisplay = resolveAprDisplay(debtTrack);
      const recurringPay = resolveRecurringPay(month, debtTrack.id, plannedPaymentUsd, todayIsoDate);

      return {
        amountUsd: debtTrack.balanceUsd,
        ...(aprDisplay.aprContextLabel === undefined ? {} : { aprContextLabel: aprDisplay.aprContextLabel }),
        aprLabel: aprDisplay.aprLabel,
        description: buildDebtDescription(debtTrack),
        id: debtTrack.id,
        name: `${debtTrack.creditor} · ${debtTrack.label}`,
        payoffLabel: debtTrack.isExcludedFromPayoffLine
          ? 'Visible, but not part of accelerated payoff guidance.'
          : 'Included in accelerated payoff guidance.',
        ...(plannedPaymentUsd <= 0
          ? {}
          : { projectedPayoffLabel: `Planned pay already loaded this month: $${plannedPaymentUsd.toFixed(2)}` }),
        recurringPay,
      } satisfies OperatingDebtCardViewModel;
    });
}

function buildPendingWeekItems(workspace: WeeklyCashFlowWorkspace): OperatingPendingWeekItem[] {
  const currentWeek = workspace.weeks.find((week) => week.weekStartDate === workspace.asOfWeekStartDate) ?? workspace.weeks[0];

  if (currentWeek === undefined) {
    return [];
  }

  return currentWeek.events
    .filter((event) => event.status === 'planned')
    .sort((leftEvent, rightEvent) => leftEvent.date.localeCompare(rightEvent.date))
    .map((event) => ({
      amountUsd: event.amount,
      id: event.id,
      label: event.label,
      scheduledDateLabel: formatDateLabel(event.date),
    }));
}

function buildCopContext(snapshot: LifePlanSnapshot): OperatingOverviewModel['copContext'] {
  return {
    locationLabel: snapshot.locationLabel,
    operationalCurrencyLabel: 'USD is the operating default.',
    teacherSalaryContextLabel: 'COP stays only as teacher-salary context in Colombia.',
  };
}

function buildProtocoloColombia(snapshot: LifePlanSnapshot): OperatingOverviewModel['protocoloColombia'] {
  return {
    badgeLabel: 'Protocolo Colombia',
    description:
      'Run the plan in USD for debt execution, keep Colombia visible for the teaching path, and use the current real week to decide what gets done now.',
    title: `${snapshot.roleGoal} · ${snapshot.locationLabel}`,
  };
}

export function buildOperatingOverviewModel(
  month: OperatingMonth,
  workspace: WeeklyCashFlowWorkspace,
  dateContext: OperatingOverviewDateContext,
  snapshot: LifePlanSnapshot,
  payoffSummary: OperatingPayoffSummary,
): OperatingOverviewModel {
  return {
    copContext: buildCopContext(snapshot),
    currentWeek: buildCurrentWeekSummary(workspace),
    dateContext,
    debtCards: buildDebtCards(month, dateContext.todayIsoDate),
    payoffSummary,
    pendingWeekItems: buildPendingWeekItems(workspace),
    protocoloColombia: buildProtocoloColombia(snapshot),
    totals: buildOperatingOverviewTotals(month, workspace.safeExtraPayment),
  };
}
