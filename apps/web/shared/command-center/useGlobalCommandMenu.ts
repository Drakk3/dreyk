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

  const commandItems = useMemo<SharedCommandMenuItem[]>(() => {
    const globalItems: SharedCommandMenuItem[] = [
      {
        description: `Return to the authenticated launcher from ${surfaceLabel}.`,
        group: 'GLOBAL',
        label: 'Open launcher',
        onSelect: () => handleCommandNavigation('/'),
        shortcut: '⌘ 1',
      },
      {
        description: 'Jump straight into the geofencing operations workspace.',
        group: 'GLOBAL',
        label: 'Open geofencing',
        onSelect: () => handleCommandNavigation('/geofencing'),
        shortcut: '⌘ 2',
      },
      {
        description: 'Open the life plan dashboard overview.',
        group: 'GLOBAL',
        label: 'Open life plan overview',
        onSelect: () => handleCommandNavigation('/life-plan'),
        shortcut: '⌘ 3',
      },
      {
        description: 'Jump to the finances section inside life plan.',
        group: 'LIFE PLAN',
        label: 'Open life plan finances',
        onSelect: () => handleCommandNavigation('/life-plan?section=finances'),
      },
      {
        description: 'Jump to the teaching track inside life plan.',
        group: 'LIFE PLAN',
        label: 'Open life plan teaching',
        onSelect: () => handleCommandNavigation('/life-plan?section=teaching'),
      },
      {
        description: 'Jump to the risks and contingencies view inside life plan.',
        group: 'LIFE PLAN',
        label: 'Open life plan risks',
        onSelect: () => handleCommandNavigation('/life-plan?section=contingencies'),
      },
      {
        description: 'Close the current authenticated session.',
        group: 'SESSION',
        label: 'Sign out',
        onSelect: handleSignOutClick,
        shortcut: '⌘ ⇧ Q',
      },
    ];

    if (isAdminRole(role)) {
      globalItems.splice(globalItems.length - 1, 0, {
        description: 'Open the isolated admin control panel.',
        group: 'ADMIN',
        label: 'Open admin panel',
        onSelect: () => handleCommandNavigation('/admin'),
      });
    }

    return [...localItems, ...globalItems];
  }, [handleCommandNavigation, handleSignOutClick, localItems, role, surfaceLabel]);

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
