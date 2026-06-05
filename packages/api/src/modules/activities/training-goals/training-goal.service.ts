import {
  archiveTrainingGoalRecord,
  calculateTrainingGoalActivityCount,
  calculateTrainingGoalDistanceMeters,
  closeTrainingGoalVersion,
  createTrainingGoalRecord,
  createTrainingGoalVersion,
  deletePendingTrainingGoalVersions,
  findActiveTrainingGoal,
  getActiveTrainingGoal,
  listActiveTrainingGoalVersions,
  transaction,
} from "./training-goal.repository";
import type {
  TrainingGoal,
  TrainingGoalArchiveInput,
  TrainingGoalCreateInput,
  TrainingGoalProgress,
  TrainingGoalSportScope,
  TrainingGoalUpdateInput,
} from "./training-goal.types";
import {
  TrainingGoalAlreadyExistsError,
  TrainingGoalNotFoundError,
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
  assertValidTargetValue(targetValue);

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

export async function updateTrainingGoal({
  id,
  now = new Date(),
  targetValue,
  userId,
}: TrainingGoalUpdateInput): Promise<TrainingGoal> {
  assertValidTargetValue(targetValue);

  return transaction(async (database) => {
    const goal = await getActiveTrainingGoal({ database, id, userId });

    if (!goal) {
      throw new TrainingGoalNotFoundError();
    }

    const { periodEndAt } = getTrainingGoalPeriodRange({
      date: now,
      period: goal.period,
    });

    await deletePendingTrainingGoalVersions({
      database,
      effectiveFromPeriodStartAt: periodEndAt,
      trainingGoalId: goal.id,
    });
    await closeTrainingGoalVersion({
      database,
      effectiveUntilPeriodStartAt: periodEndAt,
      trainingGoalVersionId: goal.trainingGoalVersionId,
    });
    const version = await createTrainingGoalVersion({
      database,
      effectiveFromPeriodStartAt: periodEndAt,
      targetValue,
      trainingGoalId: goal.id,
    });

    return {
      ...goal,
      effectiveFromPeriodStartAt: version.effectiveFromPeriodStartAt,
      effectiveUntilPeriodStartAt: version.effectiveUntilPeriodStartAt,
      targetValue: version.targetValue,
      trainingGoalVersionId: version.trainingGoalVersionId,
    };
  });
}

export async function archiveTrainingGoal({
  id,
  now = new Date(),
  userId,
}: TrainingGoalArchiveInput): Promise<{ archived: true }> {
  return transaction(async (database) => {
    const goal = await getActiveTrainingGoal({ database, id, userId });

    if (!goal) {
      throw new TrainingGoalNotFoundError();
    }

    const { periodStartAt } = getTrainingGoalPeriodRange({
      date: now,
      period: goal.period,
    });

    await deletePendingTrainingGoalVersions({
      database,
      effectiveFromPeriodStartAt: periodStartAt,
      trainingGoalId: goal.id,
    });
    await closeTrainingGoalVersion({
      database,
      effectiveUntilPeriodStartAt: periodStartAt,
      trainingGoalVersionId: goal.trainingGoalVersionId,
    });
    await archiveTrainingGoalRecord({
      archivedAt: now,
      database,
      trainingGoalId: goal.id,
    });

    return { archived: true };
  });
}

export async function listTrainingGoalProgress({
  now = new Date(),
  userId,
}: {
  now?: Date;
  userId: string;
}): Promise<TrainingGoalProgress[]> {
  const goals = selectCurrentPeriodGoalVersions({
    goals: await listActiveTrainingGoalVersions({ userId }),
    now,
  });

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

function selectCurrentPeriodGoalVersions({
  goals,
  now,
}: {
  goals: TrainingGoal[];
  now: Date;
}) {
  const groupedGoals = new Map<number, TrainingGoal[]>();

  for (const goal of goals) {
    groupedGoals.set(goal.id, [...(groupedGoals.get(goal.id) ?? []), goal]);
  }

  const selectedGoals: TrainingGoal[] = [];

  for (const versions of groupedGoals.values()) {
    const [goal] = versions;

    if (!goal) {
      continue;
    }

    const { periodStartAt } = getTrainingGoalPeriodRange({
      date: now,
      period: goal.period,
    });
    const currentVersion = versions.find(
      (version) =>
        version.effectiveFromPeriodStartAt <= periodStartAt &&
        (version.effectiveUntilPeriodStartAt === null ||
          version.effectiveUntilPeriodStartAt > periodStartAt),
    );

    if (currentVersion) {
      selectedGoals.push(currentVersion);
    }
  }

  return selectedGoals;
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

function assertValidTargetValue(targetValue: number) {
  if (!Number.isInteger(targetValue) || targetValue <= 0) {
    throw new TrainingGoalTargetValueError();
  }
}
