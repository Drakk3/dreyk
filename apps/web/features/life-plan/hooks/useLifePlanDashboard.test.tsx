import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createOperatingEntry } from '../services/operatingEntryMutations';
import {
  createDerivedRecurringBootstrapMonth,
  createInitialBootstrapMonth,
  createSeedOperatingMonth,
} from '../services/operatingMonthBootstrap';
import { buildOperatingMonthShell } from '../services/operatingRecurringQueue';
import type { FinancialSourceMetadata, OperatingMonth } from '../types';
import type { CreatePersistedOperatingMonthInput, PersistedOperatingMonthSummary } from './useLifePlanPersistence';
import { useLifePlanDashboard } from './useLifePlanDashboard';

const persistenceMocks = vi.hoisted(() => ({
  createMonth: vi.fn<(input: CreatePersistedOperatingMonthInput) => Promise<OperatingMonth | null>>(),
  listMonths: vi.fn<() => Promise<PersistedOperatingMonthSummary[]>>(),
  loadMonth: vi.fn<(month: string) => Promise<OperatingMonth | null>>(),
  saveMonth: vi.fn<(month: OperatingMonth) => Promise<OperatingMonth | null>>(),
}));

vi.mock('@/shared/lib/errors', () => ({
  handleError: vi.fn(),
}));

vi.mock('./useLifePlanPersistence', () => ({
  useLifePlanPersistence: () => ({
    createMonth: persistenceMocks.createMonth,
    errorMessage: null,
    isLoading: false,
    isSaving: false,
    listMonths: persistenceMocks.listMonths,
    loadMonth: persistenceMocks.loadMonth,
    saveMonth: persistenceMocks.saveMonth,
  }),
}));

function createBaseMonth(): OperatingMonth {
  const seedMonth = createSeedOperatingMonth();

  return createInitialBootstrapMonth(buildOperatingMonthShell(seedMonth, seedMonth.month));
}

function createPersistedMonthSummary(month: OperatingMonth): PersistedOperatingMonthSummary {
  return {
    id: month.id,
    month: month.month,
    seededFromMonthId: month.seededFromMonthId ?? null,
  };
}

function createManualSource(label: string): FinancialSourceMetadata {
  return {
    capturedOn: '2026-05-16',
    kind: 'manual',
    label,
  };
}

describe('useLifePlanDashboard', () => {
  beforeEach(() => {
    persistenceMocks.createMonth.mockReset();
    persistenceMocks.listMonths.mockReset();
    persistenceMocks.loadMonth.mockReset();
    persistenceMocks.saveMonth.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('bootstraps and persists the first month when storage is empty', async () => {
    const createdMonth = buildOperatingMonthShell(createBaseMonth(), '2026-05');
    const persistedMonth = createInitialBootstrapMonth(createdMonth);

    persistenceMocks.listMonths.mockResolvedValue([]);
    persistenceMocks.createMonth.mockResolvedValue(createdMonth);
    persistenceMocks.saveMonth.mockResolvedValue(persistedMonth);

    const { result } = renderHook(() => useLifePlanDashboard());

    await waitFor(() => {
      expect(result.current.activeOperatingMonth.id).toBe(persistedMonth.id);
    });

    expect(persistenceMocks.createMonth).toHaveBeenCalledWith({ month: createdMonth.month });
    expect(persistenceMocks.saveMonth).toHaveBeenCalledTimes(1);
    expect(result.current.availableOperatingMonths).toHaveLength(1);
    expect(result.current.availableOperatingMonths[0]?.id).toBe(persistedMonth.id);
    expect(result.current.availableOperatingMonths[0]?.month).toBe(persistedMonth.month);
    expect(result.current.availableOperatingMonths[0]?.label.length).toBeGreaterThan(0);
  });

  it('loads the first persisted month without creating a replacement', async () => {
    const existingMonth = createBaseMonth();

    persistenceMocks.listMonths.mockResolvedValue([createPersistedMonthSummary(existingMonth)]);
    persistenceMocks.loadMonth.mockResolvedValue(existingMonth);

    const { result } = renderHook(() => useLifePlanDashboard());

    await waitFor(() => {
      expect(result.current.activeOperatingMonth.id).toBe(existingMonth.id);
    });

    expect(persistenceMocks.createMonth).not.toHaveBeenCalled();
    expect(persistenceMocks.saveMonth).not.toHaveBeenCalled();
    expect(result.current.availableOperatingMonths[0]?.month).toBe(existingMonth.month);
  });

  it('creates and bootstraps the next month when navigating forward', async () => {
    const existingMonth = createBaseMonth();
    const nextMonth = buildOperatingMonthShell(existingMonth, '2026-06');
    const persistedNextMonth = createDerivedRecurringBootstrapMonth(existingMonth, nextMonth);

    persistenceMocks.listMonths.mockResolvedValue([createPersistedMonthSummary(existingMonth)]);
    persistenceMocks.loadMonth.mockResolvedValue(existingMonth);
    persistenceMocks.createMonth.mockResolvedValue(nextMonth);
    persistenceMocks.saveMonth.mockResolvedValue(persistedNextMonth);

    const { result } = renderHook(() => useLifePlanDashboard());

    await waitFor(() => {
      expect(result.current.activeOperatingMonth.id).toBe(existingMonth.id);
    });

    act(() => {
      result.current.handleNavigateOperatingMonth(1);
    });

    await waitFor(() => {
      expect(persistenceMocks.createMonth).toHaveBeenCalledWith({
        month: '2026-06',
        seededFromMonthId: existingMonth.id,
      });
    });

    await waitFor(() => {
      expect(result.current.activeOperatingMonth.month).toBe('2026-06');
    });

    expect(persistenceMocks.saveMonth).toHaveBeenCalledTimes(1);
    expect(result.current.availableOperatingMonths.map((month) => month.month)).toEqual(['2026-05', '2026-06']);
  });

  it('persists entry mutations through saveMonth and exposes the saved month state', async () => {
    const existingMonth = createBaseMonth();
    const createdEntryMonth = createOperatingEntry(existingMonth, {
      amountUsd: 35,
      category: 'food',
      confidence: 'verified',
      date: '2026-05-16',
      kind: 'expense',
      label: 'Corner store fuel',
      source: createManualSource('Manual capture'),
      sourceKind: 'manual',
      status: 'planned',
    });
    const savedMutationInputs: OperatingMonth[] = [];

    persistenceMocks.listMonths.mockResolvedValue([createPersistedMonthSummary(existingMonth)]);
    persistenceMocks.loadMonth.mockResolvedValue(existingMonth);
    persistenceMocks.saveMonth.mockImplementation((month) => {
      savedMutationInputs.push(month);
      return Promise.resolve(createdEntryMonth);
    });

    const { result } = renderHook(() => useLifePlanDashboard());

    await waitFor(() => {
      expect(result.current.activeOperatingMonth.id).toBe(existingMonth.id);
    });

    act(() => {
      result.current.handleCreateOperatingEntry({
        amountUsd: 35,
        category: 'food',
        confidence: 'verified',
        date: '2026-05-16',
        kind: 'expense',
        label: 'Corner store fuel',
        source: createManualSource('Manual capture'),
        sourceKind: 'manual',
        status: 'planned',
      });
    });

    await waitFor(() => {
      expect(persistenceMocks.saveMonth).toHaveBeenCalledTimes(1);
    });

    const savedMutationInput = savedMutationInputs[0];

    if (savedMutationInput === undefined) {
      throw new Error('Expected saveMonth to receive the mutated month.');
    }

    expect(savedMutationInput.entries.some((entry) => entry.label === 'Corner store fuel')).toBe(true);

    await waitFor(() => {
      expect(result.current.activeOperatingMonth.entries.some((entry) => entry.label === 'Corner store fuel')).toBe(true);
    });
  });
});
