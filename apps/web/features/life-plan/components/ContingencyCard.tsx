'use client';

import { Badge } from '@/components/thegridcn/badge';
import { AlertBanner } from '@/components/thegridcn/alert';
import { DataCard } from '@/components/thegridcn/data-card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import type { ContingencyItem, ContingencyPlanSummary } from '../types';

interface ContingencyCardProps {
  contingencyPlan: ContingencyPlanSummary;
}

function getSeverityVariant(severity: ContingencyItem['severity']): 'danger' | 'warning' | 'outline' {
  if (severity === 'high') {
    return 'danger';
  }

  if (severity === 'medium') {
    return 'warning';
  }

  return 'outline';
}

function getAreaLabel(area: ContingencyItem['area']): string {
  const labels: Record<ContingencyItem['area'], string> = {
    employment: 'empleo',
    health: 'salud',
    housing: 'vivienda',
    mobility: 'movilidad',
  };

  return labels[area];
}

export function ContingencyCard({ contingencyPlan }: ContingencyCardProps): JSX.Element {
  const topRisk = contingencyPlan.immediateActions[0] ?? contingencyPlan.orderedRisks[0];

  return (
    <DataCard
      subtitle="RISK MAP · CUMARAL"
      title="Contingencies"
      headerRight={<Badge variant="warning">{contingencyPlan.immediateActions.length} high-priority risks</Badge>}
    >
      <div className="space-y-4 p-4">
        <AlertBanner
          variant={topRisk?.severity === 'high' ? 'danger' : 'warning'}
          title={topRisk?.title ?? 'No critical risk loaded'}
          subtitle="Immediate operating pressure"
        />

        <Accordion type="single" collapsible className="rounded border border-border/60 bg-background/30 px-4">
          {contingencyPlan.orderedRisks.map((risk) => (
            <AccordionItem key={risk.id} value={risk.id}>
              <AccordionTrigger className="text-left">
                <div className="flex flex-1 items-center gap-3">
                  <Badge variant={getSeverityVariant(risk.severity)}>{risk.severity}</Badge>
                  <div>
                    <div className="font-mono text-xs uppercase tracking-[0.18em] text-foreground">{risk.title}</div>
                    <div className="text-xs text-muted-foreground">{getAreaLabel(risk.area)} · {risk.owner}</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <span className="font-semibold text-foreground">Trigger:</span> {risk.trigger}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Action:</span> {risk.action}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </DataCard>
  );
}
