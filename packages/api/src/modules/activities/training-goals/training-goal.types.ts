export type TrainingGoalMetric = "distance" | "activityCount";

export type TrainingGoalPeriod = "trainingWeek" | "calendarMonth";

export type TrainingGoalSportScope = "running";

export type TrainingGoal = {
  archivedAt: Date | null;
  createdAt: Date;
  effectiveFromPeriodStartAt: Date;
  effectiveUntilPeriodStartAt: Date | null;
  id: number;
  metric: TrainingGoalMetric;
  period: TrainingGoalPeriod;
  sportScope: TrainingGoalSportScope;
  targetValue: number;
  trainingGoalVersionId: number;
  updatedAt: Date;
};

export type TrainingGoalCreateInput = {
  metric: TrainingGoalMetric;
  now?: Date;
  period: TrainingGoalPeriod;
  targetValue: number;
  userId: string;
};

export type TrainingGoalUpdateInput = {
  id: number;
  now?: Date;
  targetValue: number;
  userId: string;
};

export type TrainingGoalArchiveInput = {
  id: number;
  now?: Date;
  userId: string;
};

export type TrainingGoalProgress = TrainingGoal & {
  achieved: boolean;
  currentValue: number;
  percentComplete: number;
  periodEndAt: Date;
  periodStartAt: Date;
};

export class TrainingGoalAlreadyExistsError extends Error {
  constructor() {
    super(
      "Active Training Goal already exists for this metric, period, and sport scope",
    );
    this.name = "TrainingGoalAlreadyExistsError";
  }
}

export class TrainingGoalTargetValueError extends Error {
  constructor() {
    super("Training Goal target value must be greater than zero");
    this.name = "TrainingGoalTargetValueError";
  }
}

export class TrainingGoalNotFoundError extends Error {
  constructor() {
    super("Active Training Goal was not found");
    this.name = "TrainingGoalNotFoundError";
  }
}
