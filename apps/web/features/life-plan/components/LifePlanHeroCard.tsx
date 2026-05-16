'use client';

import { Badge } from '@/components/thegridcn/badge';
import { DataCard } from '@/components/thegridcn/data-card';

import type { LifePlanSnapshot, TeachingMilestone } from '../types';

interface LifePlanHeroCardProps {
  currentMilestone: TeachingMilestone | null;
  snapshot: LifePlanSnapshot;
}

export function LifePlanHeroCard({ currentMilestone, snapshot }: LifePlanHeroCardProps): JSX.Element {
  return (
    <DataCard
      subtitle="OPERATING OVERVIEW · LIFE PLAN"
      title="Cumaral operating model"
      headerRight={<Badge variant="default">USD default</Badge>}
    >
      <div className="grid gap-4 p-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/40">
              {snapshot.personName} · @{snapshot.handle}
            </p>
            <h2 className="mt-2 text-2xl font-semibold uppercase tracking-[0.12em] text-foreground">
              {snapshot.roleGoal}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{snapshot.profileSummary}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Destino · {snapshot.locationLabel}</Badge>
            <Badge variant="outline">Foco · Decreto 1278</Badge>
            <Badge variant="outline">COP solo contexto docente</Badge>
          </div>
        </div>

        <div className="rounded border border-border/60 bg-background/40 p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
            Immediate execution anchor
          </div>
          <div className="mt-3 text-sm font-semibold uppercase tracking-[0.12em] text-foreground">
            {currentMilestone?.title ?? 'Ruta docente en seguimiento'}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {currentMilestone?.action ?? 'Mantener vigilancia de convocatoria, caja y traslado operativo en Meta.'}
          </p>
          <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
            {currentMilestone?.dueLabel ?? 'Seguimiento continuo'}
          </div>
        </div>
      </div>
    </DataCard>
  );
}
