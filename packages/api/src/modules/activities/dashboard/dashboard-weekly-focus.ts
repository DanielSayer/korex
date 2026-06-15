import type { Equipment } from "../../equipment/equipment.types";
import type {
  DashboardWeeklyDistance,
  DashboardWeeklyFocus,
  DashboardWeeklyFocusReason,
  DashboardWeeklyFocusTone,
} from "../activities.types";
import type { TrainingGoalProgress } from "../training-goals/training-goal.types";

type DashboardWeeklyFocusInput = {
  activityCount: number;
  distanceMeters: number;
  equipment: Equipment[];
  goals: TrainingGoalProgress[];
  now: Date;
  weeklyDistance: DashboardWeeklyDistance;
};

type DashboardWeeklyFocusContext = {
  activityCount: number;
  daysLeft: number;
  distanceDeltaMeters: number | null;
  distanceMeters: number;
  equipmentNearRetirement?: Equipment;
  rampPercent: number | null;
  weeklyActivityGoal?: TrainingGoalProgress;
  weeklyDistanceGoal?: TrainingGoalProgress;
};

type DashboardWeeklyFocusRule = (
  context: DashboardWeeklyFocusContext,
) => DashboardWeeklyFocus | null;

const dashboardWeeklyFocusRules: DashboardWeeklyFocusRule[] = [
  restartWeekRule,
  completedGoalRule,
  volumeSpikeRule,
  closingGoalRule,
  steadyGoalRule,
];

export function buildDashboardWeeklyFocus(
  input: DashboardWeeklyFocusInput,
): DashboardWeeklyFocus {
  const context = buildDashboardWeeklyFocusContext(input);

  for (const rule of dashboardWeeklyFocusRules) {
    const focus = rule(context);

    if (focus) {
      return focus;
    }
  }

  return buildDefaultFocus(context);
}

function buildDashboardWeeklyFocusContext({
  activityCount,
  distanceMeters,
  equipment,
  goals,
  now,
  weeklyDistance,
}: DashboardWeeklyFocusInput): DashboardWeeklyFocusContext {
  return {
    activityCount,
    daysLeft: getDaysLeft({ now, weekEndAt: weeklyDistance.weekEndAt }),
    distanceDeltaMeters: weeklyDistance.distanceDeltaMeters,
    distanceMeters,
    equipmentNearRetirement: equipment.find(isNearRetirement),
    rampPercent: getRampPercent(weeklyDistance),
    weeklyActivityGoal: findWeeklyGoal(goals, "activityCount"),
    weeklyDistanceGoal: findWeeklyGoal(goals, "distance"),
  };
}

function restartWeekRule(context: DashboardWeeklyFocusContext) {
  if (context.activityCount > 0) {
    return null;
  }

  return focus({
    action: "One easy run",
    body: "No qualifying run is logged yet. Keep the first session simple and give the week an anchor before chasing volume.",
    reasons: compactReasons([
      reason("activity", "No runs logged", "warn"),
      goalProgressReason(context.weeklyDistanceGoal),
      daysLeftReason(context.daysLeft),
    ]),
    status: "restart",
    title: "Start simple.",
    tone: "warn",
  });
}

function completedGoalRule(context: DashboardWeeklyFocusContext) {
  const goalComplete =
    context.weeklyDistanceGoal?.achieved ||
    context.weeklyActivityGoal?.achieved;

  if (!goalComplete) {
    return null;
  }

  return focus({
    action: "Controlled easy volume",
    body: "The main goal is done. Add work only if it helps recovery and leaves room for next week.",
    reasons: [
      reason("goal", "Goal complete", "good"),
      distanceReason(context.distanceMeters),
      equipmentOrRecoveryReason(context.equipmentNearRetirement),
    ],
    status: "complete",
    title: "Protect the win.",
    tone: "good",
  });
}

function volumeSpikeRule(context: DashboardWeeklyFocusContext) {
  const volumeIsElevated =
    context.rampPercent !== null &&
    context.rampPercent >= 25 &&
    context.distanceMeters >= 10_000;

  if (!volumeIsElevated) {
    return null;
  }

  return focus({
    action: "Easy run or rest",
    body: "Current volume is running ahead of the comparison point. Keep the next session light so the increase stays useful.",
    reasons: compactReasons([
      reason(
        "volume",
        `+${Math.round(context.rampPercent ?? 0)}% vs last week`,
        "warn",
      ),
      equipmentReason(context.equipmentNearRetirement),
    ]),
    status: "recover",
    title: "Ease off.",
    tone: "warn",
  });
}

function closingGoalRule(context: DashboardWeeklyFocusContext) {
  const goal = context.weeklyDistanceGoal;

  if (!goal || goal.percentComplete >= 75 || context.daysLeft > 2) {
    return null;
  }

  return focus({
    action: getClosingDistanceAction(goal),
    body: "The weekly distance goal is still reachable. Finish with steady volume, not extra intensity.",
    reasons: compactReasons([
      goalProgressReason(goal, "warn"),
      daysLeftReason(context.daysLeft),
      distanceDeltaReason(context.distanceDeltaMeters),
    ]),
    status: "build",
    title: "Close the gap.",
    tone: "warn",
  });
}

function steadyGoalRule(context: DashboardWeeklyFocusContext) {
  const goal = context.weeklyDistanceGoal;

  if (!goal || goal.percentComplete < 70) {
    return null;
  }

  return focus({
    action: "Easy-to-steady run",
    body: "You are in a good position for the week. Finish the goal without adding unnecessary intensity.",
    reasons: [
      requiredGoalProgressReason(goal, "good"),
      distanceReason(context.distanceMeters),
      daysLeftReason(context.daysLeft),
    ],
    status: "steady",
    title: "Hold steady.",
    tone: "good",
  });
}

function buildDefaultFocus(context: DashboardWeeklyFocusContext) {
  const progressOrDistanceReason =
    goalProgressReason(context.weeklyDistanceGoal) ??
    distanceReason(context.distanceMeters);

  return focus({
    action: "One consistent run",
    body: "The week has a base. Add controlled volume and keep the session repeatable.",
    reasons: [
      progressOrDistanceReason,
      activityCountReason(context.activityCount),
      equipmentOrRepeatabilityReason(context.equipmentNearRetirement),
    ],
    status: "build",
    title: "Build the week.",
    tone: "default",
  });
}

function focus(input: DashboardWeeklyFocus) {
  return input;
}

function reason(
  kind: DashboardWeeklyFocusReason["kind"],
  label: string,
  tone?: DashboardWeeklyFocusTone,
): DashboardWeeklyFocusReason {
  return { kind, label, tone };
}

function goalProgressReason(
  goal: TrainingGoalProgress | undefined,
  tone?: DashboardWeeklyFocusTone,
) {
  if (!goal) {
    return null;
  }

  return requiredGoalProgressReason(goal, tone);
}

function requiredGoalProgressReason(
  goal: TrainingGoalProgress,
  tone?: DashboardWeeklyFocusTone,
) {
  return reason("goal", `${Math.round(goal.percentComplete)}% of goal`, tone);
}

function daysLeftReason(daysLeft: number) {
  return reason("time", `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`);
}

function distanceReason(distanceMeters: number) {
  return reason("volume", formatDistance(distanceMeters));
}

function distanceDeltaReason(distanceMeters: number | null) {
  if (distanceMeters === null) {
    return null;
  }

  return reason(
    "volume",
    `${formatSignedDistance(distanceMeters)} vs last week`,
  );
}

function activityCountReason(activityCount: number) {
  return reason(
    "activity",
    `${activityCount} ${activityCount === 1 ? "run" : "runs"}`,
  );
}

function equipmentReason(equipment: Equipment | undefined) {
  if (!equipment) {
    return null;
  }

  return reason("equipment", `Check ${equipment.name}`, "warn");
}

function equipmentOrRecoveryReason(equipment: Equipment | undefined) {
  return equipmentReason(equipment) ?? reason("time", "Protect recovery");
}

function equipmentOrRepeatabilityReason(equipment: Equipment | undefined) {
  return equipmentReason(equipment) ?? reason("time", "Keep it repeatable");
}

function compactReasons(
  reasons: Array<DashboardWeeklyFocusReason | null>,
): DashboardWeeklyFocusReason[] {
  return reasons.filter(
    (focusReason): focusReason is DashboardWeeklyFocusReason =>
      focusReason !== null,
  );
}

function findWeeklyGoal(
  goals: TrainingGoalProgress[],
  metric: TrainingGoalProgress["metric"],
) {
  return goals.find(
    (goal) => goal.metric === metric && goal.period === "trainingWeek",
  );
}

function isNearRetirement(equipment: Equipment) {
  if (equipment.retiredAt || !equipment.retirementDistanceMeters) {
    return false;
  }

  return (
    equipment.usageDistanceMeters / equipment.retirementDistanceMeters >= 0.9
  );
}

function getDaysLeft({ now, weekEndAt }: { now: Date; weekEndAt: Date }) {
  const remainingMs = weekEndAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(remainingMs / 86_400_000));
}

function getRampPercent(weeklyDistance: DashboardWeeklyDistance) {
  if (weeklyDistance.lastWeekAtSamePointDistanceMeters <= 0) {
    return null;
  }

  return (
    (weeklyDistance.distanceDeltaMeters /
      weeklyDistance.lastWeekAtSamePointDistanceMeters) *
    100
  );
}

function getClosingDistanceAction(goal: TrainingGoalProgress) {
  const remainingMeters = Math.max(0, goal.targetValue - goal.currentValue);

  if (remainingMeters <= 0) {
    return "Controlled easy volume";
  }

  return `${formatDistance(remainingMeters)} easy`;
}

function formatDistance(distanceMeters: number) {
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

function formatSignedDistance(distanceMeters: number) {
  const sign = distanceMeters >= 0 ? "+" : "-";
  return `${sign}${formatDistance(Math.abs(distanceMeters))}`;
}
