import type { SportType } from "../activities.types";
import {
  getNextTrainingWeekStartAt,
  getTrainingWeekStartAt,
} from "../weekly-training-summaries/training-week";
import type {
  TrainingGoalPeriod,
  TrainingGoalSportScope,
} from "./training-goal.types";

const brisbaneUtcOffsetHours = 10;
const millisecondsPerHour = 60 * 60 * 1000;

export const runningTrainingGoalSportTypes = ["run", "treadmill"] as const;

export function getTrainingGoalPeriodRange({
  date,
  period,
}: {
  date: Date;
  period: TrainingGoalPeriod;
}) {
  if (period === "trainingWeek") {
    const periodStartAt = getTrainingWeekStartAt(date);

    return {
      periodEndAt: getNextTrainingWeekStartAt(periodStartAt),
      periodStartAt,
    };
  }

  const periodStartAt = getCalendarMonthStartAt(date);

  return {
    periodEndAt: getNextCalendarMonthStartAt(periodStartAt),
    periodStartAt,
  };
}

export function getSportTypesForTrainingGoalScope(
  sportScope: TrainingGoalSportScope,
): readonly SportType[] {
  if (sportScope === "running") {
    return runningTrainingGoalSportTypes;
  }

  return [];
}

function getCalendarMonthStartAt(date: Date) {
  const brisbaneTime = new Date(
    date.getTime() + brisbaneUtcOffsetHours * millisecondsPerHour,
  );

  return fromBrisbaneCalendarDate({
    month: brisbaneTime.getUTCMonth(),
    year: brisbaneTime.getUTCFullYear(),
  });
}

function getNextCalendarMonthStartAt(monthStartAt: Date) {
  const brisbaneTime = new Date(
    monthStartAt.getTime() + brisbaneUtcOffsetHours * millisecondsPerHour,
  );

  return fromBrisbaneCalendarDate({
    month: brisbaneTime.getUTCMonth() + 1,
    year: brisbaneTime.getUTCFullYear(),
  });
}

function fromBrisbaneCalendarDate({
  month,
  year,
}: {
  month: number;
  year: number;
}) {
  return new Date(
    Date.UTC(year, month, 1) - brisbaneUtcOffsetHours * millisecondsPerHour,
  );
}
