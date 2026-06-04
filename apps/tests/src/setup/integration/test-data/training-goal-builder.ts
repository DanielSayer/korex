import type {
  TrainingGoalMetric,
  TrainingGoalPeriod,
  TrainingGoalSportScope,
} from "@korex/api/modules/activities/training-goals/training-goal.types";

export type TrainingGoalTestData = {
  archivedAt: Date | null;
  createdAt: Date;
  id: number;
  metric: TrainingGoalMetric;
  period: TrainingGoalPeriod;
  sportScope: TrainingGoalSportScope;
  targetValue: number;
  updatedAt: Date;
  userId: string;
  version: {
    createdAt: Date;
    effectiveFromPeriodStartAt: Date;
    effectiveUntilPeriodStartAt: Date | null;
    id: number;
    updatedAt: Date;
  };
};

export class TrainingGoalBuilder {
  static initWithUser(userId: string) {
    return new TrainingGoalBuilder(userId);
  }

  private value: TrainingGoalTestData;

  private constructor(userId: string) {
    const now = new Date("2026-04-01T00:00:00.000Z");

    this.value = {
      archivedAt: null,
      createdAt: now,
      id: 1001,
      metric: "distance",
      period: "trainingWeek",
      sportScope: "running",
      targetValue: 40_000,
      updatedAt: now,
      userId,
      version: {
        createdAt: now,
        effectiveFromPeriodStartAt: new Date("2026-03-29T14:00:00.000Z"),
        effectiveUntilPeriodStartAt: null,
        id: 1001,
        updatedAt: now,
      },
    };
  }

  withId(id: number) {
    this.value.id = id;
    this.value.version.id = id;
    return this;
  }

  withMetric(metric: TrainingGoalMetric) {
    this.value.metric = metric;
    return this;
  }

  withPeriod(period: TrainingGoalPeriod) {
    this.value.period = period;
    return this;
  }

  withSportScope(sportScope: TrainingGoalSportScope) {
    this.value.sportScope = sportScope;
    return this;
  }

  withTargetValue(targetValue: number) {
    this.value.targetValue = targetValue;
    return this;
  }

  withEffectiveFromPeriodStartAt(effectiveFromPeriodStartAt: Date) {
    this.value.version.effectiveFromPeriodStartAt = effectiveFromPeriodStartAt;
    return this;
  }

  withEffectiveUntilPeriodStartAt(effectiveUntilPeriodStartAt: Date | null) {
    this.value.version.effectiveUntilPeriodStartAt =
      effectiveUntilPeriodStartAt;
    return this;
  }

  withArchivedAt(archivedAt: Date | null) {
    this.value.archivedAt = archivedAt;
    return this;
  }

  build(): TrainingGoalTestData {
    return this.value;
  }
}
