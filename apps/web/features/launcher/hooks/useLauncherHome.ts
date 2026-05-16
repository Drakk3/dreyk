'use client';

import { MapPinned, WalletCards } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { Profile } from '@dreyk/shared/types/domain';
import type { Role } from '@dreyk/shared/types/database';

import type { LauncherFeature } from '../types';

interface UseLauncherHomeParams {
  profile: Profile;
  role: Role;
}

interface UseLauncherHomeResult {
  featureCards: LauncherFeature[];
  initials: string;
  nowLabel: string;
  roleLabel: string;
  workspaceLabel: string;
}

function getInitials(displayName: string): string {
  return displayName
    .split(/[\s._-]+/)
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function useLauncherHome({ profile, role }: UseLauncherHomeParams): UseLauncherHomeResult {
  // 1. External dependencies (store, router, clients)

  // 2. Local state
  const [now, setNow] = useState<Date | null>(null);

  // 3. Derived values (useMemo)
  const initials = useMemo(() => getInitials(profile.display_name), [profile.display_name]);
  const roleLabel = useMemo(() => `${role.toUpperCase()} · AUTHENTICATED`, [role]);
  const workspaceLabel = useMemo(() => 'PWD · apps/web · launcher@root', []);
  const nowLabel = useMemo(() => {
    if (now === null) {
      return 'SYNCING CLOCK…';
    }

    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(now);
  }, [now]);
  const featureCards = useMemo<LauncherFeature[]>(
    () => [
      {
        ctaLabel: 'Open geofencing',
        description: 'Inspect the operations shell, telemetry mockups, and zone activity preview.',
        href: '/geofencing',
        icon: MapPinned,
        key: 'geofencing',
        kicker: 'Operations / Mobility',
        status: 'Ready now',
        title: 'Geofencing',
      },
      {
        ctaLabel: 'Open life plan',
        description: 'Review the operating overview and weekly cash-flow workspace.',
        href: '/life-plan',
        icon: WalletCards,
        key: 'life-plan',
        kicker: 'Planning / Personal Ops',
        status: 'Ready now',
        title: 'Life plan',
      },
    ],
    [],
  );

  // 4. Handlers and effects (useCallback, useEffect)
  useEffect(() => {
    setNow(new Date());

    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  // 5. Single return object — NEVER return an array from a hook
  return {
    featureCards,
    initials,
    nowLabel,
    roleLabel,
    workspaceLabel,
  };
}
