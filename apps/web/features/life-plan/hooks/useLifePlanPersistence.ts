'use client';

import { useCallback, useState } from 'react';

import type { Database } from '@dreyk/shared/types/database';

import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { AppError, handleError } from '@/shared/lib/errors';

import {
  mapMonthRecord,
  mapOperatingMonthToWritePayload,
  mapPersistenceRecordToOperatingMonth,
} from '../services/lifePlanPersistence';
import type { OperatingMonth } from '../types';

export interface PersistedOperatingMonthSummary {
  id: string;
  month: string;
  seededFromMonthId: string | null;
}

export interface CreatePersistedOperatingMonthInput {
  month: string;
  seededFromMonthId?: string | null;
}

interface UseLifePlanPersistenceResult {
  createMonth: (input: CreatePersistedOperatingMonthInput) => Promise<OperatingMonth | null>;
  errorMessage: string | null;
  isLoading: boolean;
  isSaving: boolean;
  listMonths: () => Promise<PersistedOperatingMonthSummary[]>;
  loadMonth: (month: string) => Promise<OperatingMonth | null>;
  saveMonth: (month: OperatingMonth) => Promise<OperatingMonth | null>;
}

interface PersistedEntryRowId {
  id: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function resolveRowId(row: unknown): string {
  if (typeof row !== 'object' || row === null || !('id' in row)) {
    throw new AppError('Missing row id', 'useLifePlanPersistence.resolveRowId');
  }

  const { id } = row;

  if (typeof id !== 'string') {
    throw new AppError('Invalid row id', 'useLifePlanPersistence.resolveRowId');
  }

  return id;
}

export function useLifePlanPersistence(): UseLifePlanPersistenceResult {
  // 1. External dependencies (store, router, clients)
  const [supabase] = useState(() => getSupabaseBrowserClient());

  // 2. Local state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 3. Derived values (useMemo)

  // 4. Handlers and effects (useCallback, useEffect)
  const getOwnerUserId = useCallback(async (): Promise<string> => {
    const { data, error } = await supabase.auth.getUser();

    if (error !== null) {
      throw new AppError(error.message, 'useLifePlanPersistence.getOwnerUserId', error);
    }

    if (data.user === null) {
      throw new AppError('Authenticated user is required for life-plan persistence.', 'useLifePlanPersistence.getOwnerUserId');
    }

    return data.user.id;
  }, [supabase]);

  const deleteRemovedEntries = useCallback(
    async (ownerUserId: string, monthId: string, persistedEntryIds: string[]): Promise<void> => {
      const existingEntryResult = await supabase
        .from('life_plan_month_entries')
        .select('id')
        .eq('owner_user_id', ownerUserId)
        .eq('month_id', monthId)
        .overrideTypes<PersistedEntryRowId[]>();
      const existingEntryRows = existingEntryResult.data ?? [];
      const existingEntryError = existingEntryResult.error;

      if (existingEntryError !== null) {
        throw new AppError(
          existingEntryError.message,
          'useLifePlanPersistence.deleteRemovedEntries.select',
          existingEntryError,
        );
      }

      const persistedEntryIdSet = new Set(persistedEntryIds);
      const deletedEntryIds = existingEntryRows
        .map((entryRow) => entryRow.id)
        .filter((entryId) => !persistedEntryIdSet.has(entryId));

      if (deletedEntryIds.length === 0) {
        return;
      }

      const { error } = await supabase
        .from('life_plan_month_entries')
        .delete()
        .eq('owner_user_id', ownerUserId)
        .in('id', deletedEntryIds);

      if (error !== null) {
        throw new AppError(error.message, 'useLifePlanPersistence.deleteRemovedEntries.delete', error);
      }
    },
    [supabase],
  );

  const loadMonth = useCallback(
    async (month: string): Promise<OperatingMonth | null> => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const ownerUserId = await getOwnerUserId();
        const monthResult = await supabase
          .from('life_plan_months')
          .select('*')
          .eq('owner_user_id', ownerUserId)
          .eq('month_key', month)
          .maybeSingle()
          .overrideTypes<Database['public']['Tables']['life_plan_months']['Row'] | null>();
        const monthRow = monthResult.data;
        const monthError = monthResult.error;

        if (monthError !== null) {
          throw new AppError(monthError.message, 'useLifePlanPersistence.loadMonth.month', monthError);
        }

        if (monthRow === null) {
          return null;
        }

        const monthId = resolveRowId(monthRow);

        const [entryResult, historyResult, debtResult, templateResult, paymentEventResult] = await Promise.all([
          supabase
            .from('life_plan_month_entries')
            .select('*')
            .eq('owner_user_id', ownerUserId)
            .order('entry_date', { ascending: true })
            .overrideTypes<Database['public']['Tables']['life_plan_month_entries']['Row'][]>(),
          supabase
            .from('life_plan_entry_status_history')
            .select('*')
            .eq('owner_user_id', ownerUserId)
            .order('changed_at', { ascending: true })
            .overrideTypes<Database['public']['Tables']['life_plan_entry_status_history']['Row'][]>(),
          supabase
            .from('life_plan_debt_accounts')
            .select('*')
            .eq('owner_user_id', ownerUserId)
            .order('priority', { ascending: true })
            .overrideTypes<Database['public']['Tables']['life_plan_debt_accounts']['Row'][]>(),
          supabase
            .from('life_plan_recurring_templates')
            .select('*')
            .eq('owner_user_id', ownerUserId)
            .order('scheduled_day', { ascending: true })
            .overrideTypes<Database['public']['Tables']['life_plan_recurring_templates']['Row'][]>(),
          supabase
            .from('life_plan_debt_payment_events')
            .select('*')
            .eq('owner_user_id', ownerUserId)
            .order('payment_date', { ascending: true })
            .overrideTypes<Database['public']['Tables']['life_plan_debt_payment_events']['Row'][]>(),
        ]);

        if (entryResult.error !== null) {
          throw new AppError(
            entryResult.error.message,
            'useLifePlanPersistence.loadMonth.entries',
            entryResult.error,
          );
        }

        if (historyResult.error !== null) {
          throw new AppError(
            historyResult.error.message,
            'useLifePlanPersistence.loadMonth.statusHistory',
            historyResult.error,
          );
        }

        if (debtResult.error !== null) {
          throw new AppError(
            debtResult.error.message,
            'useLifePlanPersistence.loadMonth.debtAccounts',
            debtResult.error,
          );
        }

        if (templateResult.error !== null) {
          throw new AppError(
            templateResult.error.message,
            'useLifePlanPersistence.loadMonth.recurringTemplates',
            templateResult.error,
          );
        }

        if (paymentEventResult.error !== null) {
          throw new AppError(
            paymentEventResult.error.message,
            'useLifePlanPersistence.loadMonth.debtPaymentEvents',
            paymentEventResult.error,
          );
        }

        const entryRows: Database['public']['Tables']['life_plan_month_entries']['Row'][] = entryResult.data ?? [];
        const historyRows: Database['public']['Tables']['life_plan_entry_status_history']['Row'][] =
          historyResult.data ?? [];
        const debtRows: Database['public']['Tables']['life_plan_debt_accounts']['Row'][] = debtResult.data ?? [];
        const templateRows: Database['public']['Tables']['life_plan_recurring_templates']['Row'][] =
          templateResult.data ?? [];
        const paymentEventRows: Database['public']['Tables']['life_plan_debt_payment_events']['Row'][] =
          paymentEventResult.data ?? [];

        const monthScopedEntryRows = entryRows.filter((entryRow) => entryRow.month_id === monthId);
        const monthEntryIds = new Set(monthScopedEntryRows.map((entryRow) => entryRow.id));
        const filteredHistoryRows = historyRows.filter((historyRow) => monthEntryIds.has(historyRow.entry_id));
        const filteredPaymentEventRows = paymentEventRows.filter((paymentEventRow) => {
          return monthEntryIds.has(paymentEventRow.entry_id);
        });

        return mapPersistenceRecordToOperatingMonth(
          mapMonthRecord(
            monthRow,
            monthScopedEntryRows,
            filteredHistoryRows,
            debtRows,
            templateRows,
            filteredPaymentEventRows,
          ),
        );
      } catch (error: unknown) {
        handleError(error, 'useLifePlanPersistence.loadMonth');
        setErrorMessage('Unable to load the persisted life-plan month. Retry once the Supabase session is healthy.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getOwnerUserId, supabase],
  );

  const listMonths = useCallback(async (): Promise<PersistedOperatingMonthSummary[]> => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const ownerUserId = await getOwnerUserId();
      const { data, error } = await supabase
        .from('life_plan_months')
        .select('id, month_key, seeded_from_month_id')
        .eq('owner_user_id', ownerUserId)
        .order('month_key', { ascending: true })
        .overrideTypes<Array<Pick<Database['public']['Tables']['life_plan_months']['Row'], 'id' | 'month_key' | 'seeded_from_month_id'>>>();
      const monthRows = data ?? [];

      if (error !== null) {
        throw new AppError(error.message, 'useLifePlanPersistence.listMonths', error);
      }

      return monthRows.map((monthRow) => ({
        id: monthRow.id,
        month: monthRow.month_key,
        seededFromMonthId: monthRow.seeded_from_month_id,
      }));
    } catch (error: unknown) {
      handleError(error, 'useLifePlanPersistence.listMonths');
      setErrorMessage('Unable to list persisted life-plan months.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getOwnerUserId, supabase]);

  const createMonth = useCallback(
    async (input: CreatePersistedOperatingMonthInput): Promise<OperatingMonth | null> => {
      setIsSaving(true);
      setErrorMessage(null);

      try {
        const ownerUserId = await getOwnerUserId();
        // @ts-expect-error Supabase table insert types still infer never until generated client types are refreshed.
        const { error } = await supabase.from('life_plan_months').upsert(
          {
            currency_code: 'USD',
            month_key: input.month,
            owner_user_id: ownerUserId,
            seeded_from_month_id: input.seededFromMonthId ?? null,
          },
          { onConflict: 'owner_user_id,month_key' },
        );

        if (error !== null) {
          throw new AppError(error.message, 'useLifePlanPersistence.createMonth', error);
        }

        return await loadMonth(input.month);
      } catch (error: unknown) {
        handleError(error, 'useLifePlanPersistence.createMonth');
        setErrorMessage('Unable to create the persisted life-plan month.');
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [getOwnerUserId, loadMonth, supabase],
  );

  const saveMonth = useCallback(
    async (month: OperatingMonth): Promise<OperatingMonth | null> => {
      setIsSaving(true);
      setErrorMessage(null);

      try {
        if (!isUuid(month.id)) {
          throw new AppError(
            'Persisted month saves require a Supabase UUID-backed month id after the explicit bootstrap/rebase step runs.',
            'useLifePlanPersistence.saveMonth',
          );
        }

        const ownerUserId = await getOwnerUserId();
        const writePayload = mapOperatingMonthToWritePayload(ownerUserId, month);

        const monthMutation = supabase.from('life_plan_months');
        // @ts-expect-error Supabase table mutation types still infer never until generated client types are refreshed.
        const { error: monthError } = await monthMutation.upsert(writePayload.monthRow, { onConflict: 'id' });

        if (monthError !== null) {
          throw new AppError(monthError.message, 'useLifePlanPersistence.saveMonth.month', monthError);
        }

        await deleteRemovedEntries(
          ownerUserId,
          month.id,
          writePayload.entryRows.flatMap((entryRow) => (entryRow.id === undefined ? [] : [entryRow.id])),
        );

        if (writePayload.debtAccountRows.length > 0) {
          const debtAccountMutation = supabase.from('life_plan_debt_accounts');
          // @ts-expect-error Supabase table mutation types still infer never until generated client types are refreshed.
          const { error } = await debtAccountMutation.upsert(writePayload.debtAccountRows, { onConflict: 'id' });

          if (error !== null) {
            throw new AppError(error.message, 'useLifePlanPersistence.saveMonth.debtAccounts', error);
          }
        }

        if (writePayload.recurringTemplateRows.length > 0) {
          const recurringTemplateMutation = supabase.from('life_plan_recurring_templates');
          // @ts-expect-error Supabase table mutation types still infer never until generated client types are refreshed.
          const { error } = await recurringTemplateMutation.upsert(writePayload.recurringTemplateRows, { onConflict: 'id' });

          if (error !== null) {
            throw new AppError(error.message, 'useLifePlanPersistence.saveMonth.recurringTemplates', error);
          }
        }

        if (writePayload.entryRows.length > 0) {
          const entryMutation = supabase.from('life_plan_month_entries');
          // @ts-expect-error Supabase table mutation types still infer never until generated client types are refreshed.
          const { error } = await entryMutation.upsert(writePayload.entryRows, { onConflict: 'id' });

          if (error !== null) {
            throw new AppError(error.message, 'useLifePlanPersistence.saveMonth.entries', error);
          }
        }

        if (writePayload.entryStatusHistoryRows.length > 0) {
          const statusHistoryMutation = supabase.from('life_plan_entry_status_history');
          // @ts-expect-error Supabase table mutation types still infer never until generated client types are refreshed.
          const { error } = await statusHistoryMutation.upsert(writePayload.entryStatusHistoryRows, { onConflict: 'id' });

          if (error !== null) {
            throw new AppError(error.message, 'useLifePlanPersistence.saveMonth.statusHistory', error);
          }
        }

        if (writePayload.debtPaymentEventRows.length > 0) {
          const debtPaymentEventMutation = supabase.from('life_plan_debt_payment_events');
          // @ts-expect-error Supabase table mutation types still infer never until generated client types are refreshed.
          const { error } = await debtPaymentEventMutation.upsert(writePayload.debtPaymentEventRows, { onConflict: 'id' });

          if (error !== null) {
            throw new AppError(error.message, 'useLifePlanPersistence.saveMonth.debtPaymentEvents', error);
          }
        }

        return await loadMonth(month.month);
      } catch (error: unknown) {
        handleError(error, 'useLifePlanPersistence.saveMonth');
        setErrorMessage('Unable to save the persisted life-plan month.');
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [deleteRemovedEntries, getOwnerUserId, loadMonth, supabase],
  );

  // 5. Single return object — NEVER return an array from a hook
  return {
    createMonth,
    errorMessage,
    isLoading,
    isSaving,
    listMonths,
    loadMonth,
    saveMonth,
  };
}
