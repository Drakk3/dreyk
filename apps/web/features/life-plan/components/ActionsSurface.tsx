'use client';

import { Badge } from '@/components/thegridcn/badge';
import { DataCard } from '@/components/thegridcn/data-card';

import { useActionsExecutionBrief } from '../hooks/useActionsExecutionBrief';

interface ActionsSurfaceProps {
  reservedProp?: never;
}

interface SectionTitleProps {
  title: string;
}

interface ActionLineProps {
  detail: string;
  tag: string;
  title: string;
}

function SectionTitle({ title }: SectionTitleProps): JSX.Element {
  return <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground">{title}</h2>;
}

function ActionLine({ detail, tag, title }: ActionLineProps): JSX.Element {
  return (
    <li className="grid gap-2 border-b border-border/40 py-3 last:border-b-0 md:grid-cols-[1fr_auto] md:items-start">
      <div>
        <div className="text-sm font-medium text-foreground">{title}</div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/45">{tag}</span>
    </li>
  );
}

export function ActionsSurface(_: ActionsSurfaceProps): JSX.Element {
  const brief = useActionsExecutionBrief();

  return (
    <DataCard
      subtitle="ACTIONS · EXECUTION TRACK"
      title="Actions / Protocolo Colombia"
      headerRight={<Badge variant="default">May 16, 2026</Badge>}
    >
      <div className="space-y-8 p-5">
        <div className="space-y-3 border-b border-border/50 pb-5">
          <p className="max-w-4xl text-sm leading-7 text-muted-foreground">{brief.intro}</p>
          <p className="max-w-4xl text-sm leading-7 text-foreground/80">{brief.principle}</p>
        </div>

        {brief.timeline.map((block) => (
          <section key={block.label} className="space-y-3">
            <SectionTitle title={block.label} />
            <p className="text-sm leading-7 text-muted-foreground">{block.description}</p>
            <ul className="rounded border border-border/60 bg-background/25 px-4">
              {block.items.map((item) => (
                <ActionLine key={item.title} detail={item.detail} tag={item.tag} title={item.title} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </DataCard>
  );
}
