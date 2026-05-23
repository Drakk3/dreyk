'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import { useAuthSignOut } from '@/shared/hooks/useAuthSignOut';

import type {
  AppCommandHref,
  SharedCommandMenuItem,
  UseGlobalCommandMenuParams,
  UseGlobalCommandMenuResult,
} from './types';

function isAdminRole(role: UseGlobalCommandMenuParams['role']): boolean {
  return role === 'admin';
}

function getSurfaceLabel(currentSurface: UseGlobalCommandMenuParams['currentSurface']): string {
  if (currentSurface === 'launcher') {
    return 'launcher';
  }

  if (currentSurface === 'geofencing') {
    return 'geofencing';
  }

  if (currentSurface === 'life-plan') {
    return 'life plan';
  }

  if (currentSurface === 'fitness') {
    return 'fitness';
  }

  return 'admin';
}

export function useGlobalCommandMenu({
  currentSurface,
  localItems = [],
  role,
}: UseGlobalCommandMenuParams): UseGlobalCommandMenuResult {
  // 1. External dependencies (store, router, clients)
  const router = useRouter();
  const { handleSignOut } = useAuthSignOut();

  // 2. Local state
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState<boolean>(false);

  // 3. Derived values (useMemo)
  const surfaceLabel = useMemo(() => getSurfaceLabel(currentSurface), [currentSurface]);

  const commandItems = useMemo<SharedCommandMenuItem[]>(() => {
    const navigateTo = (href: AppCommandHref): void => {
      setIsCommandMenuOpen(false);
      router.push(href);
    };

    const signOutFromMenu = (): void => {
      setIsCommandMenuOpen(false);
      void handleSignOut();
    };

    const globalItems: SharedCommandMenuItem[] = [
      {
        description: `Return to the authenticated launcher from ${surfaceLabel}.`,
        group: 'GLOBAL',
        label: 'Open launcher',
        onSelect: () => navigateTo('/'),
        shortcut: '⌘ 1',
      },
      {
        description: 'Jump straight into the geofencing operations workspace.',
        group: 'GLOBAL',
        label: 'Open geofencing',
        onSelect: () => navigateTo('/geofencing'),
        shortcut: '⌘ 2',
      },
      {
        description: 'Open the life plan dashboard overview.',
        group: 'GLOBAL',
        label: 'Open life plan overview',
        onSelect: () => navigateTo('/life-plan?section=overview'),
        shortcut: '⌘ 3',
      },
      {
        description: 'Open the shared fitness plan workspace.',
        group: 'GLOBAL',
        label: 'Open fitness plan',
        onSelect: () => navigateTo('/fitness?section=juan'),
        shortcut: '⌘ 4',
      },
      {
        description: 'Jump to the operating cash-flow workspace inside life plan.',
        group: 'LIFE PLAN',
        label: 'Open life plan cash flow',
        onSelect: () => navigateTo('/life-plan?section=cash-flow'),
      },
      {
        description: 'Open the reserved teaching placeholder inside life plan.',
        group: 'LIFE PLAN',
        label: 'Open life plan teaching',
        onSelect: () => navigateTo('/life-plan?section=teaching'),
      },
      {
        description: 'Open the reserved actions placeholder inside life plan.',
        group: 'LIFE PLAN',
        label: 'Open life plan actions',
        onSelect: () => navigateTo('/life-plan?section=actions'),
      },
      {
        description: 'Open Juan training inside the fitness workspace.',
        group: 'FITNESS',
        label: 'Open fitness Juan',
        onSelect: () => navigateTo('/fitness?section=juan'),
      },
      {
        description: 'Open Yasmis training inside the fitness workspace.',
        group: 'FITNESS',
        label: 'Open fitness Yasmis',
        onSelect: () => navigateTo('/fitness?section=yasmis'),
      },
      {
        description: 'Open macro and meal planning inside the fitness workspace.',
        group: 'FITNESS',
        label: 'Open fitness nutrition',
        onSelect: () => navigateTo('/fitness?section=nutrition'),
      },
      {
        description: 'Open milestones and rules inside the fitness workspace.',
        group: 'FITNESS',
        label: 'Open fitness goals',
        onSelect: () => navigateTo('/fitness?section=goals'),
      },
      {
        description: 'Close the current authenticated session.',
        group: 'SESSION',
        label: 'Sign out',
        onSelect: signOutFromMenu,
        shortcut: '⌘ ⇧ Q',
      },
    ];

    if (isAdminRole(role)) {
      globalItems.splice(globalItems.length - 1, 0, {
        description: 'Open the isolated admin control panel.',
        group: 'ADMIN',
        label: 'Open admin panel',
        onSelect: () => navigateTo('/admin'),
      });
    }

    return [...localItems, ...globalItems];
  }, [handleSignOut, localItems, role, router, surfaceLabel]);

  // 4. Handlers and effects (useCallback, useEffect)
  const handleCommandMenuChange = useCallback((open: boolean): void => {
    setIsCommandMenuOpen(open);
  }, []);

  const handleCommandMenuOpen = useCallback((): void => {
    setIsCommandMenuOpen(true);
  }, []);

  const handleCommandMenuToggle = useCallback((): void => {
    setIsCommandMenuOpen((currentValue) => !currentValue);
  }, []);

  const handleCommandNavigation = useCallback(
    (href: AppCommandHref): void => {
      setIsCommandMenuOpen(false);
      router.push(href);
    },
    [router],
  );

  const handleSignOutClick = useCallback((): void => {
    setIsCommandMenuOpen(false);
    void handleSignOut();
  }, [handleSignOut]);

  // 5. Single return object — NEVER return an array from a hook
  return {
    commandItems,
    handleCommandMenuChange,
    handleCommandMenuOpen,
    handleCommandMenuToggle,
    handleCommandNavigation,
    isCommandMenuOpen,
  };
}
