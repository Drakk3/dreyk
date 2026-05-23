'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { FITNESS_PLAN_DOCUMENT } from '../mockData';
import { FITNESS_NAV_ITEMS } from '../navigation';
import { buildFitnessTimelineEntries, getFitnessProgressPercentage } from '../services/fitnessProgress';
import type { FitnessSectionKey } from '../types';

interface UseFitnessDashboardParams {
  initialSection: FitnessSectionKey;
}

interface FitnessTab {
  label: string;
  value: FitnessSectionKey;
}

interface UseFitnessDashboardResult {
  activeSection: FitnessSectionKey;
  handleSectionChange: (section: FitnessSectionKey) => void;
  planDocument: typeof FITNESS_PLAN_DOCUMENT;
  progressPercentage: number;
  tabs: FitnessTab[];
  timelineItems: ReturnType<typeof buildFitnessTimelineEntries>;
}

export function useFitnessDashboard({ initialSection }: UseFitnessDashboardParams): UseFitnessDashboardResult {
  // 1. External dependencies (store, router, clients)

  // 2. Local state
  const [activeSection, setActiveSection] = useState<FitnessSectionKey>(initialSection);

  // 3. Derived values (useMemo)
  const tabs = useMemo(() => FITNESS_NAV_ITEMS.map((item) => ({ label: item.label, value: item.key })), []);
  const progressPercentage = useMemo(() => getFitnessProgressPercentage(FITNESS_PLAN_DOCUMENT.dates), []);
  const timelineItems = useMemo(() => buildFitnessTimelineEntries(FITNESS_PLAN_DOCUMENT.goals), []);

  // 4. Handlers and effects (useCallback, useEffect)
  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  const handleSectionChange = useCallback((section: FitnessSectionKey): void => {
    setActiveSection(section);
  }, []);

  // 5. Single return object — NEVER return an array from a hook
  return {
    activeSection,
    handleSectionChange,
    planDocument: FITNESS_PLAN_DOCUMENT,
    progressPercentage,
    tabs,
    timelineItems,
  };
}
