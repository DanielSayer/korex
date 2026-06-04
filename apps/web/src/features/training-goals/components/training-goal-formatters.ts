import type {
  TrainingGoalPeriod,
  TrainingGoalProgress,
} from "@korex/api/modules/activities/training-goals/training-goal.types";

function formatGoalTitle(goal: TrainingGoalProgress) {
  if (goal.metric === "activityCount") {
    return `${goal.targetValue} runs`;
  }

  return `${formatKilometers(goal.targetValue)} running`;
}

function formatGoalProgress(goal: TrainingGoalProgress) {
  if (goal.metric === "activityCount") {
    return `${goal.currentValue} / ${goal.targetValue} runs`;
  }

  return `${formatKilometers(goal.currentValue)} / ${formatKilometers(goal.targetValue)}`;
}

function formatGoalPeriod(period: TrainingGoalPeriod) {
  return period === "trainingWeek" ? "This training week" : "This month";
}

function formatKilometers(distanceMeters: number) {
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

export { formatGoalPeriod, formatGoalProgress, formatGoalTitle };
