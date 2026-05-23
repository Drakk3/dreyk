'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import type { FitnessAthletePlan, FitnessCallout } from '../types';

interface FitnessAthletePanelProps {
  athlete: FitnessAthletePlan;
}

interface AthleteAccentClasses {
  avatar: string;
  frame: string;
  badge: string;
  text: string;
  row: string;
}

function getAccentClasses(accent: FitnessAthletePlan['accent']): AthleteAccentClasses {
  if (accent === 'amber') {
    return {
      avatar: 'border-amber-400/60 bg-amber-500/12 text-amber-200 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.15)]',
      frame: 'border-amber-400/30 bg-[linear-gradient(180deg,rgba(245,158,11,0.09),rgba(245,158,11,0.03))]',
      badge: 'border-amber-400/40 bg-amber-500/10 text-amber-200',
      text: 'text-amber-300',
      row: 'data-[state=open]:border-amber-400/25',
    };
  }

  return {
    avatar: 'border-primary/60 bg-primary/12 text-primary shadow-[inset_0_0_0_1px_rgba(34,211,238,0.12)]',
    frame: 'border-primary/30 bg-[linear-gradient(180deg,rgba(34,211,238,0.08),rgba(34,211,238,0.03))]',
    badge: 'border-primary/40 bg-primary/10 text-primary',
    text: 'text-primary',
    row: 'data-[state=open]:border-primary/25',
  };
}

function getCalloutClasses(callout: FitnessCallout): string {
  if (callout.tone === 'amber') {
    return 'border-amber-400/50 bg-amber-500/10 text-amber-100';
  }

  if (callout.tone === 'green') {
    return 'border-emerald-400/50 bg-emerald-500/10 text-emerald-100';
  }

  return 'border-border/70 bg-background/40 text-foreground/75';
}

export function FitnessAthletePanel({ athlete }: FitnessAthletePanelProps): JSX.Element {
  const accentClasses = getAccentClasses(athlete.accent);
  const defaultWorkoutDayId = athlete.days[0]?.id;

  return (
    <div className="space-y-4">
      <section className={`rounded-[24px] border p-5 backdrop-blur-sm ${accentClasses.frame}`}>
        <div className="flex flex-wrap items-center gap-4 lg:gap-5">
          <div
            className={`flex size-14 items-center justify-center rounded-full border font-mono text-base tracking-[0.2em] ${accentClasses.avatar}`}
          >
            {athlete.avatarLabel}
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/35">Ficha operativa</div>
            <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-foreground">{athlete.name}</h2>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/45">{athlete.stats}</p>
          </div>

          <div className={`rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] ${accentClasses.badge}`}>
            {athlete.badgeLabel}
          </div>
        </div>
      </section>

      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/38">{athlete.structureLabel}</div>
      </div>

      {athlete.note !== undefined ? (
        <div className={`rounded-r-xl rounded-l-sm border px-4 py-3 text-sm leading-6 ${getCalloutClasses(athlete.note)}`}>
          {athlete.note.text}
        </div>
      ) : null}

      <Accordion
        type="single"
        collapsible
        className="space-y-2.5"
        {...(defaultWorkoutDayId !== undefined ? { defaultValue: defaultWorkoutDayId } : {})}
      >
        {athlete.days.map((day) => (
          <AccordionItem
            key={day.id}
            value={day.id}
            className={`overflow-hidden rounded-2xl border border-border/60 bg-card/70 px-0 transition-colors ${accentClasses.row}`}
          >
            <AccordionTrigger className="px-4 py-3.5 hover:no-underline data-[state=open]:border-b data-[state=open]:border-border/60">
              <div className="grid flex-1 gap-2 text-left md:grid-cols-[auto_1fr_auto] md:items-center md:gap-3">
                <span className={`w-fit rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${accentClasses.badge}`}>
                  {day.dayLabel}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">{day.title}</div>
                  <div className="text-xs text-muted-foreground">{day.focus}</div>
                </div>
                <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${accentClasses.text} md:text-right`}>
                  {day.exercises.length} ejercicios
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-4">
              <div className="space-y-2.5">
                {day.exercises.map((exercise) => (
                  <article key={exercise.id} className="grid gap-3 rounded-xl border border-border/50 bg-background/35 p-3 md:grid-cols-[72px_1fr_auto] md:items-center">
                    <img
                      alt={exercise.imageAlt}
                      className="h-[60px] w-[72px] rounded-md border border-border/40 bg-background object-cover"
                      loading="lazy"
                      src={exercise.imageUrl}
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-foreground/95">{exercise.name}</h3>
                      <p className="mt-1 text-[11px] leading-5 text-foreground/42">{exercise.tip}</p>
                    </div>
                    <div className="font-mono uppercase tracking-[0.16em] text-foreground/55 md:min-w-[84px] md:text-right">
                      <div className="text-[22px] leading-none text-foreground">{exercise.prescription.split(' · ')[0]}</div>
                      <div className="mt-1 text-[10px]">{exercise.prescription.split(' · ')[1] ?? ''}</div>
                    </div>
                  </article>
                ))}

                {day.note !== undefined ? (
                  <div className={`rounded-r-xl rounded-l-sm border px-3 py-2.5 text-sm leading-6 ${getCalloutClasses(day.note)}`}>
                    {day.note.text}
                  </div>
                ) : null}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
