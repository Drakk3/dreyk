'use client';

import type { FitnessExpectedResult, FitnessMilestone, FitnessRule, FitnessTimelineEntry } from '../types';

interface FitnessGoalsPanelProps {
  expectedResults: FitnessExpectedResult[];
  milestones: FitnessMilestone[];
  progressPercentage: number;
  rules: FitnessRule[];
  timelineItems: FitnessTimelineEntry[];
}

function getBorderClass(accent: FitnessExpectedResult['accent']): string {
  return accent === 'amber'
    ? 'border-amber-400/40 bg-amber-500/8 text-amber-100'
    : 'border-primary/40 bg-primary/8 text-primary';
}

function getMilestoneClass(index: number): string {
  if (index === 0) {
    return 'border-primary/35 bg-primary/8';
  }

  if (index === 1) {
    return 'border-amber-400/35 bg-amber-500/8';
  }

  return 'border-emerald-400/35 bg-emerald-500/8';
}

function getRuleClass(rule: FitnessRule): string {
  if (rule.tone === 'green') {
    return 'border-emerald-400/35 bg-emerald-500/8 before:bg-emerald-400';
  }

  if (rule.tone === 'amber') {
    return 'border-amber-400/35 bg-amber-500/8 before:bg-amber-400';
  }

  return 'border-border/60 bg-card/70 before:bg-border';
}

export function FitnessGoalsPanel({
  expectedResults,
  milestones,
  progressPercentage,
  rules,
  timelineItems,
}: FitnessGoalsPanelProps): JSX.Element {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Línea de tiempo · May 21 → Nov 13, 2026</div>
        <div className="grid gap-3 xl:grid-cols-3">
          {milestones.map((milestone, index) => (
            <article key={milestone.id} className={`rounded-2xl border p-4 ${getMilestoneClass(index)}`}>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/60">{milestone.dateLabel}</div>
              <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-foreground">{milestone.title}</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-foreground/80">
                {milestone.items.map((item) => (
                  <li key={`${milestone.id}-${item}`}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/40">
          <span>Progreso del plan · May 21 → Nov 13</span>
          <span className="text-foreground/60">{progressPercentage}%</span>
        </div>
        <div className="h-[5px] overflow-hidden rounded-full bg-foreground/10">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progressPercentage}%` }} />
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-sm">
        <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
          Timeline / checkpoints del plan
        </div>
        <div className="space-y-0">
          {timelineItems.map((item, index) => {
            const isActive = item.status === 'active';
            const isCompleted = item.status === 'completed';
            const dotClassName = isActive
              ? 'border-primary bg-primary shadow-[0_0_10px_var(--primary)]'
              : isCompleted
                ? 'border-primary/60 bg-primary'
                : 'border-border bg-background';
            const lineClassName = isCompleted || isActive ? 'bg-primary/35' : 'bg-border/60';

            return (
              <article key={`${item.date}-${item.title}`} className="grid grid-cols-[18px_1fr] gap-4 pb-5 last:pb-0">
                <div className="flex flex-col items-center">
                  <span className={`mt-1 size-2.5 rounded-full border ${dotClassName}`} />
                  {index < timelineItems.length - 1 ? <span className={`mt-2 w-px flex-1 ${lineClassName}`} /> : null}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/35">{item.date}</span>
                    {isActive ? (
                      <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-primary">
                        Actual
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm leading-6 text-foreground/62">{item.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Resultados esperados</div>
        <div className="grid gap-3 lg:grid-cols-2">
          {expectedResults.map((result) => (
            <article key={result.id} className={`rounded-2xl border p-4 ${getBorderClass(result.accent)}`}>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em]">{result.label}</div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-foreground/92">
                {result.items.map((item) => (
                  <li key={`${result.id}-${item}`} className="font-medium text-foreground/92">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">Reglas del plan</div>
        <div className="space-y-3">
          {rules.map((rule) => (
            <article
              key={rule.id}
              className={`relative rounded-xl border px-4 py-3 pl-5 before:absolute before:bottom-3 before:left-0 before:top-3 before:w-px before:rounded-full ${getRuleClass(rule)}`}
            >
              <div className="flex gap-3">
                <span className="font-mono text-base text-foreground/65">{rule.icon}</span>
                <p className="text-sm leading-6 text-foreground/80">
                  <strong className="text-foreground">{rule.title}</strong> {rule.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
