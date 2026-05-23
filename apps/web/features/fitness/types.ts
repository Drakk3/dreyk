export type FitnessSectionKey = 'juan' | 'yasmis' | 'nutrition' | 'goals';

export type FitnessAccent = 'blue' | 'amber' | 'green' | 'neutral';

export interface FitnessPlanDates {
  checkpointIso: string;
  checkpointLabel: string;
  endIso: string;
  endLabel: string;
  startIso: string;
  startLabel: string;
}

export interface FitnessHeader {
  subtitle: string;
  title: string;
}

export interface FitnessCallout {
  text: string;
  tone: FitnessAccent;
}

export interface FitnessExercise {
  id: string;
  imageAlt: string;
  imageUrl: string;
  name: string;
  prescription: string;
  tip: string;
}

export interface FitnessWorkoutDay {
  dayLabel: string;
  exercises: FitnessExercise[];
  focus: string;
  id: string;
  note?: FitnessCallout;
  title: string;
}

export interface FitnessAthletePlan {
  accent: Extract<FitnessAccent, 'blue' | 'amber'>;
  avatarLabel: string;
  badgeLabel: string;
  id: 'juan' | 'yasmis';
  name: string;
  note?: FitnessCallout;
  stats: string;
  structureLabel: string;
  days: FitnessWorkoutDay[];
}

export interface FitnessMacroTarget {
  label: string;
  sublabel: string;
  value: string;
}

export interface FitnessNutritionProfile {
  accent: Extract<FitnessAccent, 'blue' | 'amber'>;
  adjustmentNote: FitnessCallout;
  athleteLabel: string;
  macroTargets: FitnessMacroTarget[];
}

export interface FitnessMealColumn {
  lines: string[];
  summary: string;
}

export interface FitnessMealRow {
  juan: FitnessMealColumn;
  mealLabel: string;
  yasmis: FitnessMealColumn;
}

export interface FitnessMealPlan {
  focus: string;
  id: string;
  meals: FitnessMealRow[];
  note?: FitnessCallout;
  tagAccent: Extract<FitnessAccent, 'blue' | 'green'>;
  tagLabel: string;
  title: string;
}

export interface FitnessMilestone {
  dateIso: string;
  dateLabel: string;
  id: string;
  items: string[];
  title: string;
}

export interface FitnessTimelineEntry {
  date: string;
  description: string;
  status: 'active' | 'completed' | 'upcoming';
  title: string;
}

export interface FitnessExpectedResult {
  accent: Extract<FitnessAccent, 'blue' | 'amber'>;
  id: string;
  items: string[];
  label: string;
}

export interface FitnessRule {
  description: string;
  icon: string;
  id: string;
  title: string;
  tone?: Extract<FitnessAccent, 'amber' | 'green'>;
}

export interface FitnessPlanDocument {
  athletes: FitnessAthletePlan[];
  dates: FitnessPlanDates;
  expectedResults: FitnessExpectedResult[];
  goals: FitnessMilestone[];
  header: FitnessHeader;
  hydrationNote: FitnessCallout;
  nutrition: FitnessNutritionProfile[];
  nutritionMealPlans: FitnessMealPlan[];
  rules: FitnessRule[];
}
