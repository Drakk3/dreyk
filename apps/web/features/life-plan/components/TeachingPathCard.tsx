'use client';

import { Badge } from '@/components/thegridcn/badge';
import { DataCard } from '@/components/thegridcn/data-card';
import { Timeline } from '@/components/thegridcn/timeline';

import type { TeachingMilestone, TeachingPathSummary } from '../types';

interface TeachingPathCardProps {
  teachingPath: TeachingPathSummary;
}

function getTimelineStatus(stage: TeachingMilestone['stage']): 'completed' | 'active' | 'upcoming' {
  if (stage === 'done') {
    return 'completed';
  }

  if (stage === 'current') {
    return 'active';
  }

  return 'upcoming';
}

export function TeachingPathCard({ teachingPath }: TeachingPathCardProps): JSX.Element {
  return (
    <DataCard
      subtitle="CAREER PATH · META"
      title="Teaching path"
      headerRight={
        <Badge variant="default">{teachingPath.currentMilestone?.dueLabel ?? teachingPath.nextMilestone?.dueLabel ?? 'En curso'}</Badge>
      }
    >
      <div className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded border border-border/60 bg-background/30 p-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Current milestone</div>
            <div className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-foreground">
              {teachingPath.currentMilestone?.title ?? 'Ruta monitoreada'}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {teachingPath.currentMilestone?.action ?? 'Mantener continuidad documental y seguimiento a convocatorias.'}
            </p>
          </div>
          <div className="rounded border border-border/60 bg-background/30 p-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Next milestone</div>
            <div className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-foreground">
              {teachingPath.nextMilestone?.title ?? 'Sostener prioridad actual'}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {teachingPath.nextMilestone?.action ?? 'Sin hito siguiente configurado.'}
            </p>
          </div>
        </div>

        <Timeline
          label="DECRETO 1278 · EXECUTION ORDER"
          items={teachingPath.orderedMilestones.map((milestone) => ({
            date: milestone.dueLabel,
            description: milestone.description,
            status: getTimelineStatus(milestone.stage),
            title: milestone.title,
          }))}
        />
      </div>
    </DataCard>
  );
}
