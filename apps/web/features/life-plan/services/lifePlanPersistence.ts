import type {
  Database,
  Json,
  LifePlanDebtAccountRow,
  LifePlanDebtPaymentEventRow,
  LifePlanEntryStatusHistoryRow,
  LifePlanMonthEntryRow,
  LifePlanRecurringTemplateRow,
} from '@dreyk/shared/types/database';

import type {
  DebtSourceMetadata,
  FinancialSourceKind,
  FinancialSourceMetadata,
  JsonObject,
  LifePlanMonthPersistenceRecord,
  OperatingDebtPaymentEvent,
  OperatingEntry,
  OperatingMonth,
  OperatingRecurringQueueItem,
  OperatingRecurringTemplate,
  OperatingWeek,
} from '../types';

type LifePlanMonthInsert = Database['public']['Tables']['life_plan_months']['Insert'];
type LifePlanDebtAccountInsert = Database['public']['Tables']['life_plan_debt_accounts']['Insert'];
type LifePlanRecurringTemplateInsert = Database['public']['Tables']['life_plan_recurring_templates']['Insert'];
type LifePlanMonthEntryInsert = Database['public']['Tables']['life_plan_month_entries']['Insert'];
type LifePlanEntryStatusHistoryInsert = Database['public']['Tables']['life_plan_entry_status_history']['Insert'];
type LifePlanDebtPaymentEventInsert = Database['public']['Tables']['life_plan_debt_payment_events']['Insert'];

export interface LifePlanMonthWritePayload {
  debtAccountRows: LifePlanDebtAccountInsert[];
  debtPaymentEventRows: LifePlanDebtPaymentEventInsert[];
  entryStatusHistoryRows: LifePlanEntryStatusHistoryInsert[];
  entryRows: LifePlanMonthEntryInsert[];
  monthRow: LifePlanMonthInsert;
  recurringTemplateRows: LifePlanRecurringTemplateInsert[];
}

const FINANCIAL_SOURCE_KINDS: FinancialSourceKind[] = [
  'spreadsheet',
  'statement',
  'payStub',
  'loanDisclosure',
  'manual',
];

function isJsonObject(value: Json): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFinancialSourceKind(value: string): value is FinancialSourceKind {
  return FINANCIAL_SOURCE_KINDS.some((kind) => kind === value);
}

function readString(value: Json | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function mapJsonObject(value: Json): JsonObject {
  return isJsonObject(value) ? value : {};
}

function mapSourceMetadataFromJson(value: Json, fallbackLabel: string, fallbackCapturedOn: string): FinancialSourceMetadata {
  const sourceMetadata = mapJsonObject(value);
  const kindValue = readString(sourceMetadata.kind);
  const capturedOn = readString(sourceMetadata.capturedOn) ?? fallbackCapturedOn;
  const label = readString(sourceMetadata.label) ?? fallbackLabel;
  const notes = readString(sourceMetadata.notes);

  return {
    capturedOn,
    kind: kindValue !== undefined && isFinancialSourceKind(kindValue) ? kindValue : 'manual',
    label,
    ...(notes === undefined ? {} : { notes }),
  };
}

function mapSourceMetadataToJson(source: FinancialSourceMetadata): JsonObject {
  return {
    capturedOn: source.capturedOn,
    kind: source.kind,
    label: source.label,
    ...(source.notes === undefined ? {} : { notes: source.notes }),
  };
}

function mapDebtSourceMetadata(row: LifePlanDebtAccountRow): DebtSourceMetadata {
  const baseSource = mapSourceMetadataFromJson(
    row.source_metadata,
    `${row.creditor} · ${row.label}`,
    row.created_at.slice(0, 10),
  );

  return {
    ...baseSource,
    aprConfidence: row.apr_confidence,
    balanceConfidence: row.balance_confidence,
    minimumPaymentConfidence: row.minimum_payment_confidence,
  };
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseMonth(month: string): { monthIndex: number; year: number } {
  const [yearText, monthText] = month.split('-');
  const year = Number(yearText);
  const monthIndex = Number(monthText);

  if (!Number.isInteger(year) || !Number.isInteger(monthIndex)) {
    throw new Error(`Invalid persisted life-plan month: ${month}`);
  }

  return { monthIndex, year };
}

function formatIsoDate(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
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

function createWeeks(monthId: string, month: string): OperatingWeek[] {
  const { monthIndex, year } = parseMonth(month);
  const firstDate = new Date(Date.UTC(year, monthIndex - 1, 1));
  const lastDate = new Date(Date.UTC(year, monthIndex - 1, getDaysInMonth(year, monthIndex)));
  const firstWeekStart = resolveWeekStart(firstDate);
  const weeks: OperatingWeek[] = [];
  let weekStart = firstWeekStart;
  let index = 0;

  while (weekStart.getTime() <= lastDate.getTime()) {
    const startDate = formatIsoDate(
      weekStart.getUTCFullYear(),
      weekStart.getUTCMonth() + 1,
      weekStart.getUTCDate(),
    );
    const endDate = formatIsoDate(
      addDays(weekStart, 6).getUTCFullYear(),
      addDays(weekStart, 6).getUTCMonth() + 1,
      addDays(weekStart, 6).getUTCDate(),
    );

    weeks.push({
      entryIds: [],
      endDate,
      id: `${monthId}-week-${index + 1}-${startDate}`,
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

function resolveWeekId(weeks: OperatingWeek[], date: string): string {
  const matchedWeek = weeks.find((week) => date >= week.startDate && date <= week.endDate);
  return matchedWeek?.id ?? weeks[0]?.id ?? '';
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
  return weeks.map((week) => ({
    ...week,
    entryIds: entries.filter((entry) => entry.weekId === week.id).map((entry) => entry.id),
  }));
}

function buildScheduledDates(template: OperatingRecurringTemplate, month: string): string[] {
  const { monthIndex, year } = parseMonth(month);
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const boundedDay = Math.min(template.scheduledDay, daysInMonth);

  if (template.cadence === 'monthly') {
    return [formatIsoDate(year, monthIndex, boundedDay)];
  }

  const intervalDays = template.cadence === 'biweekly' ? 14 : 7;
  const dates: string[] = [];

  for (let day = boundedDay; day <= daysInMonth; day += intervalDays) {
    dates.push(formatIsoDate(year, monthIndex, day));
  }

  return dates;
}

function buildRecurringQueueItem(
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

function mapRecurringQueue(
  monthId: string,
  month: string,
  weeks: OperatingWeek[],
  templates: OperatingRecurringTemplate[],
  entries: OperatingEntry[],
): OperatingRecurringQueueItem[] {
  const matchedEntryIds = new Set<string>();
  const queueItems = templates
    .filter((template) => template.isActive !== false)
    .flatMap((template) => {
      return buildScheduledDates(template, month).map((scheduledDate) => {
        const linkedEntry = entries.find((entry) => {
          return entry.templateId === template.id && entry.date === scheduledDate;
        });

        if (linkedEntry !== undefined) {
          matchedEntryIds.add(linkedEntry.id);

          return {
            amountUsd: linkedEntry.amountUsd,
            cadence: template.cadence,
            category: linkedEntry.category,
            confidence: linkedEntry.confidence,
            ...(linkedEntry.debtId === undefined ? {} : { debtId: linkedEntry.debtId }),
            entryId: linkedEntry.id,
            id: `${monthId}-${template.id}-${scheduledDate}`,
            label: linkedEntry.label,
            ...(linkedEntry.notes === undefined ? {} : { notes: linkedEntry.notes }),
            scheduledDate,
            source: linkedEntry.source,
            sourceKind: linkedEntry.sourceKind,
            status: 'incorporated',
            templateId: template.id,
            weekId: linkedEntry.weekId,
          } satisfies OperatingRecurringQueueItem;
        }

        return buildRecurringQueueItem(monthId, template, scheduledDate, resolveWeekId(weeks, scheduledDate));
      });
    });

  const unmatchedLinkedEntries = entries
    .filter((entry) => entry.templateId !== undefined && !matchedEntryIds.has(entry.id))
    .map((entry) => {
      const template = templates.find((item) => item.id === entry.templateId);

      return {
        amountUsd: entry.amountUsd,
        cadence: template?.cadence ?? 'monthly',
        category: entry.category,
        confidence: entry.confidence,
        ...(entry.debtId === undefined ? {} : { debtId: entry.debtId }),
        entryId: entry.id,
        id: `${monthId}-${entry.templateId ?? entry.id}-${entry.date}`,
        label: entry.label,
        ...(entry.notes === undefined ? {} : { notes: entry.notes }),
        scheduledDate: entry.date,
        source: entry.source,
        sourceKind: entry.sourceKind,
        status: 'incorporated',
        templateId: entry.templateId ?? '',
        weekId: entry.weekId,
      } satisfies OperatingRecurringQueueItem;
    });

  return [...queueItems, ...unmatchedLinkedEntries].sort((leftItem, rightItem) => {
    if (leftItem.scheduledDate !== rightItem.scheduledDate) {
      return leftItem.scheduledDate.localeCompare(rightItem.scheduledDate);
    }

    return leftItem.label.localeCompare(rightItem.label);
  });
}

function mapEntry(row: LifePlanMonthEntryRow, weeks: OperatingWeek[]): OperatingEntry {
  return {
    amountUsd: row.amount_usd,
    category: row.category,
    confidence: row.confidence,
    date: row.entry_date,
    ...(row.debt_account_id === null ? {} : { debtId: row.debt_account_id }),
    id: row.id,
    kind: row.kind,
    label: row.label,
    ...(row.notes === null ? {} : { notes: row.notes }),
    source: mapSourceMetadataFromJson(row.source_metadata, row.label, row.created_at.slice(0, 10)),
    sourceKind: row.source_kind,
    status: row.status,
    ...(row.template_id === null ? {} : { templateId: row.template_id }),
    weekId: resolveWeekId(weeks, row.entry_date),
  };
}

function mapDebtPaymentEvent(row: LifePlanDebtPaymentEventRow): OperatingDebtPaymentEvent {
  return {
    amountUsd: row.amount_usd,
    ...(row.balance_after_usd === null ? {} : { balanceAfterUsd: row.balance_after_usd }),
    createdAt: row.created_at,
    debtId: row.debt_account_id,
    entryId: row.entry_id,
    id: row.id,
    ...(row.notes === null ? {} : { notes: row.notes }),
    paymentDate: row.payment_date,
  };
}

function mapRecurringTemplate(row: LifePlanRecurringTemplateRow): OperatingRecurringTemplate {
  return {
    amountUsd: row.amount_usd,
    cadence: row.cadence,
    category: row.category,
    confidence: row.confidence,
    ...(row.debt_account_id === null ? {} : { debtId: row.debt_account_id }),
    id: row.id,
    isActive: row.is_active,
    label: row.label,
    ...(row.notes === null ? {} : { notes: row.notes }),
    scheduledDay: row.scheduled_day,
    source: mapSourceMetadataFromJson(row.source_metadata, row.label, row.created_at.slice(0, 10)),
  };
}

export function mapPersistenceRecordToOperatingMonth(record: LifePlanMonthPersistenceRecord): OperatingMonth {
  const weeks = createWeeks(record.monthRow.id, record.monthRow.month_key);
  const entries = sortEntries(record.entryRows.map((row) => mapEntry(row, weeks)));
  const recurringTemplates = record.recurringTemplateRows.map(mapRecurringTemplate);

  return {
    currencyCode: 'USD',
    debtPaymentEvents: record.debtPaymentEventRows.map(mapDebtPaymentEvent),
    debtTracks: [...record.debtAccountRows]
      .sort((leftRow, rightRow) => leftRow.priority - rightRow.priority)
      .map((row) => ({
        apr: row.apr_assumption_decimal ?? 0,
        aprAssumptionDecimal: row.apr_assumption_decimal,
        aprSourceContext: mapJsonObject(row.apr_source_context),
        balanceUsd: row.balance_usd,
        confidence: row.confidence,
        creditor: row.creditor,
        id: row.id,
        isExcludedFromPayoffLine: row.is_excluded_from_payoff_line,
        label: row.label,
        ...(row.minimum_payment_usd === null ? {} : { minimumPaymentUsd: row.minimum_payment_usd }),
        ...(row.notes === null ? {} : { notes: row.notes }),
        priority: row.priority,
        source: mapDebtSourceMetadata(row),
      })),
    entries,
    id: record.monthRow.id,
    month: record.monthRow.month_key,
    recurringQueue: mapRecurringQueue(record.monthRow.id, record.monthRow.month_key, weeks, recurringTemplates, entries),
    recurringTemplates,
    seededFromMonthId: record.monthRow.seeded_from_month_id,
    statusHistory: [...record.entryStatusHistoryRows]
      .sort((leftRow, rightRow) => leftRow.changed_at.localeCompare(rightRow.changed_at))
      .map((row) => ({
        changedAt: row.changed_at,
        entryId: row.entry_id,
        from: row.from_status,
        id: row.id,
        ...(row.reason === null ? {} : { reason: row.reason }),
        to: row.to_status,
      })),
    weeks: syncWeeks(weeks, entries),
  };
}

function mapDebtTrackToInsert(ownerUserId: string, debtTrack: OperatingMonth['debtTracks'][number]): LifePlanDebtAccountInsert {
  const row: LifePlanDebtAccountInsert = {
    apr_assumption_decimal: debtTrack.aprAssumptionDecimal ?? null,
    apr_confidence: debtTrack.source.aprConfidence,
    apr_source_context: debtTrack.aprSourceContext ?? {},
    balance_confidence: debtTrack.source.balanceConfidence,
    balance_usd: roundCurrency(debtTrack.balanceUsd),
    confidence: debtTrack.confidence,
    creditor: debtTrack.creditor,
    is_excluded_from_payoff_line: debtTrack.isExcludedFromPayoffLine,
    label: debtTrack.label,
    minimum_payment_confidence: debtTrack.source.minimumPaymentConfidence,
    minimum_payment_usd: debtTrack.minimumPaymentUsd ?? null,
    notes: debtTrack.notes ?? null,
    owner_user_id: ownerUserId,
    priority: debtTrack.priority,
    source_metadata: mapSourceMetadataToJson(debtTrack.source),
  };

  if (debtTrack.id.length > 0) {
    row.id = debtTrack.id;
  }

  return row;
}

function mapRecurringTemplateToInsert(
  ownerUserId: string,
  template: OperatingRecurringTemplate,
): LifePlanRecurringTemplateInsert {
  const row: LifePlanRecurringTemplateInsert = {
    amount_usd: roundCurrency(template.amountUsd),
    cadence: template.cadence === 'oneTime' ? 'monthly' : template.cadence,
    category: template.category,
    confidence: template.confidence,
    debt_account_id: template.debtId ?? null,
    is_active: template.isActive ?? true,
    label: template.label,
    notes: template.notes ?? null,
    owner_user_id: ownerUserId,
    scheduled_day: template.scheduledDay,
    source_metadata: mapSourceMetadataToJson(template.source),
  };

  if (template.id.length > 0) {
    row.id = template.id;
  }

  return row;
}

function mapEntryToInsert(ownerUserId: string, monthId: string, entry: OperatingEntry): LifePlanMonthEntryInsert {
  const row: LifePlanMonthEntryInsert = {
    amount_usd: roundCurrency(entry.amountUsd),
    category: entry.category,
    confidence: entry.confidence,
    debt_account_id: entry.debtId ?? null,
    entry_date: entry.date,
    kind: entry.kind,
    label: entry.label,
    month_id: monthId,
    notes: entry.notes ?? null,
    owner_user_id: ownerUserId,
    source_kind: entry.sourceKind,
    source_metadata: mapSourceMetadataToJson(entry.source),
    status: entry.status,
    template_id: entry.templateId ?? null,
  };

  if (entry.id.length > 0) {
    row.id = entry.id;
  }

  return row;
}

function mapStatusHistoryToInsert(
  ownerUserId: string,
  historyEntry: OperatingMonth['statusHistory'][number],
): LifePlanEntryStatusHistoryInsert {
  const row: LifePlanEntryStatusHistoryInsert = {
    changed_at: historyEntry.changedAt,
    entry_id: historyEntry.entryId,
    from_status: historyEntry.from,
    owner_user_id: ownerUserId,
    reason: historyEntry.reason ?? null,
    to_status: historyEntry.to,
  };

  if (historyEntry.id.length > 0) {
    row.id = historyEntry.id;
  }

  return row;
}

function mapDebtPaymentEventToInsert(
  ownerUserId: string,
  paymentEvent: OperatingDebtPaymentEvent,
): LifePlanDebtPaymentEventInsert {
  const row: LifePlanDebtPaymentEventInsert = {
    amount_usd: roundCurrency(paymentEvent.amountUsd),
    balance_after_usd: paymentEvent.balanceAfterUsd ?? null,
    debt_account_id: paymentEvent.debtId,
    entry_id: paymentEvent.entryId,
    notes: paymentEvent.notes ?? null,
    owner_user_id: ownerUserId,
    payment_date: paymentEvent.paymentDate,
  };

  if (paymentEvent.id.length > 0) {
    row.id = paymentEvent.id;
  }

  return row;
}

export function mapOperatingMonthToWritePayload(ownerUserId: string, month: OperatingMonth): LifePlanMonthWritePayload {
  return {
    debtAccountRows: month.debtTracks.map((debtTrack) => mapDebtTrackToInsert(ownerUserId, debtTrack)),
    debtPaymentEventRows: month.debtPaymentEvents.map((paymentEvent) => {
      return mapDebtPaymentEventToInsert(ownerUserId, paymentEvent);
    }),
    entryRows: month.entries.map((entry) => mapEntryToInsert(ownerUserId, month.id, entry)),
    entryStatusHistoryRows: month.statusHistory.map((historyEntry) => {
      return mapStatusHistoryToInsert(ownerUserId, historyEntry);
    }),
    monthRow: {
      currency_code: 'USD',
      id: month.id,
      month_key: month.month,
      owner_user_id: ownerUserId,
      seeded_from_month_id: month.seededFromMonthId ?? null,
    },
    // `recurringQueue` stays derived on read from templates + entries, so phase 4 intentionally persists only templates.
    recurringTemplateRows: month.recurringTemplates.map((template) => {
      return mapRecurringTemplateToInsert(ownerUserId, template);
    }),
  };
}

export function mapMonthRecord(
  monthRow: LifePlanMonthPersistenceRecord['monthRow'],
  entryRows: LifePlanMonthEntryRow[],
  entryStatusHistoryRows: LifePlanEntryStatusHistoryRow[],
  debtAccountRows: LifePlanDebtAccountRow[],
  recurringTemplateRows: LifePlanRecurringTemplateRow[],
  debtPaymentEventRows: LifePlanDebtPaymentEventRow[],
): LifePlanMonthPersistenceRecord {
  return {
    debtAccountRows,
    debtPaymentEventRows,
    entryRows,
    entryStatusHistoryRows,
    monthRow,
    recurringTemplateRows,
  };
}
