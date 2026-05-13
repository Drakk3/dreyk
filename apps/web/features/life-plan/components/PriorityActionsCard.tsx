'use client';

import * as React from 'react';

import { Badge } from '@/components/thegridcn/badge';
import { DataCard } from '@/components/thegridcn/data-card';
import { TabPanel, Tabs } from '@/components/thegridcn/tabs';
import { Separator } from '@/components/ui/separator';

import type { PriorityAction } from '../types';

interface PriorityActionsCardProps {
  priorityActions: PriorityAction[];
}

function getWindowLabel(window: PriorityAction['window']): string {
  if (window === '30d') {
    return '30 días';
  }

  return '90 días';
}

export function PriorityActionsCard({ priorityActions }: PriorityActionsCardProps): JSX.Element {
  const [activeTab, setActiveTab] = React.useState<string>('30d');

  return (
    <DataCard subtitle="EXECUTION · MVP" title="Priority actions">
      <div className="space-y-4 p-4">
        <Tabs
          tabs={[
            { label: '30 días', value: '30d' },
            { label: '90 días', value: '90d' },
          ]}
          value={activeTab}
          onChange={setActiveTab}
          variant="pills"
          size="sm"
        >
          <TabPanel value="30d" activeValue={activeTab} className="space-y-3">
            {priorityActions
              .filter((action) => action.window === '30d')
              .map((action) => (
                <div key={action.id} className="rounded border border-border/60 bg-background/30 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="default">{getWindowLabel(action.window)}</Badge>
                    <Badge variant="outline">{action.owner}</Badge>
                  </div>
                  <div className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-foreground">{action.title}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{action.rationale}</p>
                </div>
              ))}
          </TabPanel>

          <TabPanel value="90d" activeValue={activeTab} className="space-y-3">
            {priorityActions
              .filter((action) => action.window === '90d')
              .map((action) => (
                <div key={action.id} className="rounded border border-border/60 bg-background/30 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="warning">{getWindowLabel(action.window)}</Badge>
                    <Badge variant="outline">{action.owner}</Badge>
                  </div>
                  <div className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-foreground">{action.title}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{action.rationale}</p>
                </div>
              ))}
          </TabPanel>
        </Tabs>

        <Separator className="bg-border/60" />

        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          El MVP mantiene foco en docencia pública, saneamiento financiero y aterrizaje operativo en Cumaral.
        </p>
      </div>
    </DataCard>
  );
}
