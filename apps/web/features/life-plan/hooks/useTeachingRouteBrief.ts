'use client';

import { useMemo } from 'react';

import { buildTeachingRouteBrief } from '../services/teachingRouteBrief';
import type { TeachingRouteBrief } from '../services/teachingRouteBrief';
import type { TeachingPathSummary } from '../types';

export function useTeachingRouteBrief(teachingPath: TeachingPathSummary): TeachingRouteBrief {
  return useMemo(() => buildTeachingRouteBrief(teachingPath), [teachingPath]);
}
