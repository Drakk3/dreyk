'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import type { FitnessCallout, FitnessMealPlan, FitnessNutritionProfile } from '../types';

interface FitnessNutritionPanelProps {
  hydrationNote: FitnessCallout;
  mealPlans: FitnessMealPlan[];
  nutritionProfiles: FitnessNutritionProfile[];
}

function getAccentClass(accent: FitnessNutritionProfile['accent'] | FitnessMealPlan['tagAccent']): string {
  if (accent === 'amber') {
    return 'border-amber-400/40 bg-amber-500/10 text-amber-300';
  }

  if (accent === 'green') {
    return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300';
  }

  return 'border-primary/40 bg-primary/10 text-primary';
}

function getValueAccentClass(accent: FitnessNutritionProfile['accent']): string {
  if (accent === 'amber') {
    return 'text-amber-300';
  }

  return 'text-primary';
}

function getCalloutClasses(callout: FitnessCallout): string {
  if (callout.tone === 'amber') {
    return 'border-amber-400/40 bg-amber-500/10 text-amber-100';
  }

  if (callout.tone === 'green') {
    return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100';
  }

  return 'border-border/70 bg-background/40 text-foreground/75';
}

export function FitnessNutritionPanel({
  hydrationNote,
  mealPlans,
  nutritionProfiles,
}: FitnessNutritionPanelProps): JSX.Element {
  const defaultMealPlanId = mealPlans[0]?.id;

  return (
    <div className="space-y-6">
      {nutritionProfiles.map((profile) => (
        <section key={profile.athleteLabel} className="space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">{profile.athleteLabel}</div>
          <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            {profile.macroTargets.map((target) => (
              <article
                key={`${profile.athleteLabel}-${target.label}`}
                className="rounded-xl border border-border/60 bg-card/70 px-4 py-3 backdrop-blur-sm"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/40">{target.label}</div>
                <div className={`mt-1.5 font-mono text-[28px] leading-none ${getValueAccentClass(profile.accent)}`}>
                  {target.value}
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/35">{target.sublabel}</div>
              </article>
            ))}
          </div>
          <div className={`rounded-r-xl rounded-l-sm border px-4 py-3 text-sm leading-6 ${getCalloutClasses(profile.adjustmentNote)}`}>
            {profile.adjustmentNote.text}
          </div>
        </section>
      ))}

      <div className="space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
          Plan de comidas — días de entrenamiento y descanso
        </div>

        <Accordion
          type="single"
          collapsible
          className="space-y-2.5"
          {...(defaultMealPlanId !== undefined ? { defaultValue: defaultMealPlanId } : {})}
        >
          {mealPlans.map((mealPlan) => (
            <AccordionItem
              key={mealPlan.id}
              value={mealPlan.id}
              className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 px-0 data-[state=open]:border-border/80"
            >
              <AccordionTrigger className="px-4 py-3.5 hover:no-underline data-[state=open]:border-b data-[state=open]:border-border/60">
                <div className="grid flex-1 gap-2 text-left md:grid-cols-[auto_1fr_auto] md:items-center md:gap-3">
                  <span className={`w-fit rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${getAccentClass(mealPlan.tagAccent)}`}>
                    {mealPlan.tagLabel}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-foreground">{mealPlan.title}</div>
                    <div className="text-xs text-muted-foreground">{mealPlan.focus}</div>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/45 md:text-right">
                    {mealPlan.meals.length} comidas
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-4">
                {mealPlan.note !== undefined ? (
                  <div className={`mb-4 rounded-r-xl rounded-l-sm border px-4 py-3 text-sm leading-6 ${getCalloutClasses(mealPlan.note)}`}>
                    {mealPlan.note.text}
                  </div>
                ) : null}
                <div className="overflow-x-auto rounded-xl border border-border/50 bg-background/30">
                  <table className="min-w-full border-collapse text-[12.5px]">
                    <thead>
                      <tr className="border-b border-border/50 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/40">
                        <th className="px-4 py-3 font-normal">Comida</th>
                        <th className="px-4 py-3 font-normal text-primary">Juan</th>
                        <th className="px-4 py-3 font-normal text-amber-300">Yasmis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mealPlan.meals.map((meal) => (
                        <tr key={`${mealPlan.id}-${meal.mealLabel}`} className="align-top border-b border-border/40 last:border-b-0">
                          <td className="whitespace-nowrap px-4 py-4 font-medium text-foreground">{meal.mealLabel}</td>
                          <td className="px-4 py-4 text-foreground/78">
                            <div className="space-y-1.5 leading-6">
                              {meal.juan.lines.map((line) => (
                                <div key={`${meal.mealLabel}-juan-${line}`}>{line}</div>
                              ))}
                              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">{meal.juan.summary}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-foreground/78">
                            <div className="space-y-1.5 leading-6">
                              {meal.yasmis.lines.map((line) => (
                                <div key={`${meal.mealLabel}-yasmis-${line}`}>{line}</div>
                              ))}
                              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-300">{meal.yasmis.summary}</div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className={`rounded-r-xl rounded-l-sm border px-4 py-3 text-sm leading-6 ${getCalloutClasses(hydrationNote)}`}>
        {hydrationNote.text}
      </div>
    </div>
  );
}
