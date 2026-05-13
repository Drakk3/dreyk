import type {
  LifePlanSnapshot,
  TeachingMilestone,
  TeachingPathSummary,
} from '../types';

function sortMilestones(milestones: TeachingMilestone[]): TeachingMilestone[] {
  return [...milestones].sort((leftMilestone, rightMilestone) => leftMilestone.order - rightMilestone.order);
}

export function buildTeachingPathSummary(snapshot: LifePlanSnapshot): TeachingPathSummary {
  const orderedMilestones = sortMilestones(snapshot.milestones);

  return {
    completedMilestones: orderedMilestones.filter((milestone) => milestone.stage === 'done'),
    currentMilestone: orderedMilestones.find((milestone) => milestone.stage === 'current') ?? null,
    nextMilestone: orderedMilestones.find((milestone) => milestone.stage === 'next') ?? null,
    orderedMilestones,
  };
}
