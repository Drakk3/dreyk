'use client';

import { Tooltip } from '@/components/thegridcn/tooltip';

import type { ContingencyPlanSummary, FinancialProjection, PriorityAction, TeachingPathSummary } from '../types';

interface LifePlanKpiStripProps {
  contingencyPlan: ContingencyPlanSummary;
  financialProjection: FinancialProjection;
  priorityActions: PriorityAction[];
  teachingPath: TeachingPathSummary;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    currency: 'COP',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}

interface KpiCardProps {
  detail: string;
  helper: string;
  label: string;
  value: string;
}

function KpiCard({ detail, helper, label, value }: KpiCardProps): JSX.Element {
  return (
    <div className="rounded border border-border/60 bg-card/70 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">{label}</div>
        <Tooltip content={helper}>
          <button type="button" className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
            Why?
          </button>
        </Tooltip>
      </div>
      <div className="mt-3 text-xl font-semibold tracking-[0.08em] text-foreground">{value}</div>
      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">{detail}</p>
    </div>
  );
}

export function LifePlanKpiStrip({
  contingencyPlan,
  financialProjection,
  priorityActions,
  teachingPath,
}: LifePlanKpiStripProps): JSX.Element {
  const firstAction = priorityActions[0];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Monthly net"
        value={formatCurrency(financialProjection.monthlyNet)}
        detail="Ingreso disponible antes de acelerar metas"
        helper="Mide cuánto queda después de costos fijos y variables."
      />
      <KpiCard
        label="Emergency runway"
        value={`${financialProjection.monthlyRunway.toFixed(1)} meses`}
        detail="Colchón actual frente al costo mensual esencial"
        helper="Runway = reserva actual / costos esenciales mensuales."
      />
      <KpiCard
        label="Debt remaining"
        value={formatCurrency(financialProjection.debtCascade.remainingDebtBalance)}
        detail={
          financialProjection.debtCascade.monthsToDebtFree === null
            ? 'La deuda no se liquida dentro del horizonte actual'
            : `Deuda libre estimada en ${financialProjection.debtCascade.monthsToDebtFree} meses`
        }
        helper="La cascada cubre mínimos y dirige el extra a la deuda prioritaria."
      />
      <KpiCard
        label="Next visible move"
        value={teachingPath.currentMilestone?.title ?? firstAction?.title ?? 'Mantener foco'}
        detail={`${contingencyPlan.immediateActions.length} contingencias altas · ${firstAction?.title ?? 'sin acción cargada'}`}
        helper="Combina la acción docente inmediata con el riesgo alto más cercano."
      />
    </div>
  );
}
