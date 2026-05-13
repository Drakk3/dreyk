import type {
  ContingencyItem,
  ContingencyPlanSummary,
  LifePlanSnapshot,
} from '../types';

function getSeverityRank(severity: ContingencyItem['severity']): number {
  if (severity === 'high') {
    return 3;
  }

  if (severity === 'medium') {
    return 2;
  }

  return 1;
}

function sortContingencies(contingencies: ContingencyItem[]): ContingencyItem[] {
  return [...contingencies].sort((leftItem, rightItem) => {
    const severityDelta = getSeverityRank(rightItem.severity) - getSeverityRank(leftItem.severity);

    if (severityDelta !== 0) {
      return severityDelta;
    }

    return leftItem.title.localeCompare(rightItem.title);
  });
}

export function buildContingencyPlanSummary(snapshot: LifePlanSnapshot): ContingencyPlanSummary {
  const orderedRisks = sortContingencies(snapshot.contingencies);

  return {
    immediateActions: orderedRisks.filter((item) => item.severity === 'high'),
    orderedRisks,
  };
}
