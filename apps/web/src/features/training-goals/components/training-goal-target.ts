import type { TrainingGoalProgress } from "@korex/api/modules/activities/training-goals/training-goal.types";

type GoalMetric = TrainingGoalProgress["metric"];

function toDisplayTarget(goal: TrainingGoalProgress) {
  return goal.metric === "activityCount"
    ? goal.targetValue.toString()
    : (goal.targetValue / 1000).toString();
}

function toTargetValue({
  metric,
  target,
}: {
  metric: GoalMetric;
  target: string;
}) {
  const value = Number(target);

  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return metric === "distance" ? Math.round(value * 1000) : Math.round(value);
}

export { type GoalMetric, toDisplayTarget, toTargetValue };
