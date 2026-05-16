import type { ActivitySummary, ActivitySummaryInput } from "../activities.types";

export function summarizeActivitiesByWeek(
  activities: ActivitySummaryInput[],
): ActivitySummary[] {
  const summariesByWeek = new Map<string, ActivitySummary>();

  for (const activity of activities) {
    const weekStartDate = getWeekStartDate(activity.startAt);
    const weekKey = weekStartDate.toISOString();
    const summary = summariesByWeek.get(weekKey) ?? {
      distanceMeters: 0,
      durationSeconds: 0,
      totalElevationGainMeters: 0,
      weekStartDate,
    };

    summary.distanceMeters += activity.distanceMeters ?? 0;
    summary.durationSeconds += activity.durationSeconds ?? 0;
    summary.totalElevationGainMeters += activity.totalElevationGainMeters ?? 0;
    summariesByWeek.set(weekKey, summary);
  }

  return Array.from(summariesByWeek.values()).sort(
    (first, second) =>
      second.weekStartDate.getTime() - first.weekStartDate.getTime(),
  );
}

function getWeekStartDate(date: Date) {
  const weekStartDate = new Date(date);
  const day = weekStartDate.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  weekStartDate.setHours(0, 0, 0, 0);
  weekStartDate.setDate(weekStartDate.getDate() - daysSinceMonday);

  return weekStartDate;
}
