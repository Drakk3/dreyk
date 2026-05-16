'use client';

import { Badge } from '@/components/thegridcn/badge';
import { DataCard } from '@/components/thegridcn/data-card';

interface PlaceholderSurfaceCardProps {
  badgeLabel: string;
  description: string;
  subtitle: string;
  title: string;
}

export function PlaceholderSurfaceCard({ badgeLabel, description, subtitle, title }: PlaceholderSurfaceCardProps): JSX.Element {
  return (
    <DataCard subtitle={subtitle} title={title} headerRight={<Badge variant="outline">{badgeLabel}</Badge>}>
      <div className="p-6">
        <div className="rounded border border-dashed border-border/60 bg-background/30 px-4 py-10 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Placeholder</p>
          <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </DataCard>
  );
}
