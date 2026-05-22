import type { SportType } from "../activities.types";

export { getPreviousTrainingWeekStartAt } from "../weekly-training-summaries/training-week";

export const trainingStreakQualifyingSportTypes = [
  "run",
  "treadmill",
] as const satisfies SportType[];

export function isTrainingStreakQualifyingSportType(sportType: SportType) {
  return trainingStreakQualifyingSportTypes.includes(
    sportType as (typeof trainingStreakQualifyingSportTypes)[number],
  );
}
