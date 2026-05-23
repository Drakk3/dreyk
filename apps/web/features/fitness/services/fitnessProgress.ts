import type { FitnessMilestone, FitnessPlanDates, FitnessTimelineEntry } from '../types';

function toMiddayTimestamp(isoDate: string): number {
  return Date.parse(`${isoDate}T12:00:00Z`);
}

export function getFitnessProgressPercentage(dates: FitnessPlanDates, now: Date = new Date()): number {
  const start = toMiddayTimestamp(dates.startIso);
  const end = toMiddayTimestamp(dates.endIso);
  const current = now.getTime();

  if (current <= start) {
    return 0;
  }

  if (current >= end) {
    return 100;
  }

  return Math.round(((current - start) / (end - start)) * 100);
}

export function buildFitnessTimelineEntries(
  milestones: FitnessMilestone[],
  now: Date = new Date(),
): FitnessTimelineEntry[] {
  const currentTimestamp = now.getTime();
  const firstUpcomingIndex = milestones.findIndex((milestone) => toMiddayTimestamp(milestone.dateIso) > currentTimestamp);
  const activeIndex = firstUpcomingIndex === -1 ? milestones.length - 1 : Math.max(firstUpcomingIndex - 1, 0);

  return milestones.map((milestone, index) => {
    let status: FitnessTimelineEntry['status'] = 'upcoming';

    if (index < activeIndex) {
      status = 'completed';
    } else if (index === activeIndex) {
      status = 'active';
    }

    return {
      title: milestone.title,
      date: milestone.dateLabel,
      description: milestone.items.join(' · '),
      status,
    };
  });
}
