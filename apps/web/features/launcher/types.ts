import type { LucideIcon } from 'lucide-react';

export type LauncherFeatureKey = 'geofencing' | 'life-plan' | 'fitness';

export interface LauncherFeature {
  ctaLabel: string;
  description: string;
  href: '/geofencing' | '/life-plan' | '/fitness';
  icon: LucideIcon;
  key: LauncherFeatureKey;
  kicker: string;
  status: string;
  title: string;
}

export interface LauncherCommandItem {
  description: string;
  group: string;
  label: string;
  onSelect: () => void;
  shortcut: string;
}
