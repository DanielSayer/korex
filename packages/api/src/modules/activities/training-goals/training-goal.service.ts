import {
  calculateTrainingGoalActivityCount,
  calculateTrainingGoalDistanceMeters,
  createTrainingGoalRecord,
  findActiveTrainingGoal,
  listTrainingGoals,
  transaction,
} from "./training-goal.repository";
import type {
  TrainingGoal,
  TrainingGoalCreateInput,
  TrainingGoalProgress,
  TrainingGoalSportScope,
} from "./training-goal.types";
import {
  TrainingGoalAlreadyExistsError,
  TrainingGoalTargetValueError,
} from "./training-goal.types";
import {
  getSportTypesForTrainingGoalScope,
  getTrainingGoalPeriodRange,
} from "./training-goals";

export async function createTrainingGoal({
  metric,
  now = new Date(),
  period,
  targetValue,
  userId,
}: TrainingGoalCreateInput): Promise<TrainingGoal> {
  if (!Number.isInteger(targetValue) || targetValue <= 0) {
    throw new TrainingGoalTargetValueError();
  }

  const sportScope = "running" satisfies TrainingGoalSportScope;
  const { periodStartAt } = getTrainingGoalPeriodRange({ date: now, period });

  return transaction(async (database) => {
    const existingGoal = await findActiveTrainingGoal({
      database,
      metric,
      period,
      sportScope,
      userId,
    });

    if (existingGoal) {
      throw new TrainingGoalAlreadyExistsError();
    }

    return createTrainingGoalRecord({
      database,
      effectiveFromPeriodStartAt: periodStartAt,
      metric,
      period,
      sportScope,
      targetValue,
      userId,
    });
  });
}

export async function listTrainingGoalProgress({
  now = new Date(),
  userId,
}: {
  now?: Date;
  userId: string;
}): Promise<TrainingGoalProgress[]> {
  const goals = (await listTrainingGoals({ userId })).filter(
    (goal) => goal.archivedAt === null,
  );

  return Promise.all(
    goals.map(async (goal) => {
      const { periodEndAt, periodStartAt } = getTrainingGoalPeriodRange({
        date: now,
        period: goal.period,
      });
      const currentValue = await calculateCurrentValue({
        goal,
        periodEndAt,
        periodStartAt,
        userId,
      });

      return {
        ...goal,
        achieved: currentValue >= goal.targetValue,
        currentValue,
        percentComplete: Math.min((currentValue / goal.targetValue) * 100, 100),
        periodEndAt,
        periodStartAt,
      };
    }),
  );
}

async function calculateCurrentValue({
  goal,
  periodEndAt,
  periodStartAt,
  userId,
}: {
  goal: TrainingGoal;
  periodEndAt: Date;
  periodStartAt: Date;
  userId: string;
}) {
  const sportTypes = getSportTypesForTrainingGoalScope(goal.sportScope);

  if (goal.metric === "activityCount") {
    return calculateTrainingGoalActivityCount({
      periodEndAt,
      periodStartAt,
      sportTypes,
      userId,
    });
  }

  return calculateTrainingGoalDistanceMeters({
    periodEndAt,
    periodStartAt,
    sportTypes,
    userId,
  });
}
