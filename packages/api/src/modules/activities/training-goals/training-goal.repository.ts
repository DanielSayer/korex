import { activities, db, trainingGoals, trainingGoalVersions } from "@korex/db";
import { and, eq, gte, inArray, isNull, lt, sql } from "drizzle-orm";
import type { SportType } from "../activities.types";
import type {
  TrainingGoal,
  TrainingGoalMetric,
  TrainingGoalPeriod,
  TrainingGoalSportScope,
} from "./training-goal.types";

type TrainingGoalDatabase = Pick<
  typeof db,
  "delete" | "insert" | "select" | "transaction" | "update"
>;

export async function transaction<T>(
  callback: (database: TrainingGoalDatabase) => Promise<T>,
) {
  return db.transaction(callback);
}

export async function createTrainingGoalRecord({
  database,
  effectiveFromPeriodStartAt,
  metric,
  period,
  sportScope,
  targetValue,
  userId,
}: {
  database: TrainingGoalDatabase;
  effectiveFromPeriodStartAt: Date;
  metric: TrainingGoalMetric;
  period: TrainingGoalPeriod;
  sportScope: TrainingGoalSportScope;
  targetValue: number;
  userId: string;
}): Promise<TrainingGoal> {
  const [createdGoal] = await database
    .insert(trainingGoals)
    .values({
      metric,
      period,
      sportScope,
      userId,
    })
    .returning({
      archivedAt: trainingGoals.archivedAt,
      createdAt: trainingGoals.createdAt,
      id: trainingGoals.id,
      metric: trainingGoals.metric,
      period: trainingGoals.period,
      sportScope: trainingGoals.sportScope,
      updatedAt: trainingGoals.updatedAt,
    });

  if (!createdGoal) {
    throw new Error("Failed to create Training Goal");
  }

  const [createdVersion] = await database
    .insert(trainingGoalVersions)
    .values({
      effectiveFromPeriodStartAt,
      targetValue,
      trainingGoalId: createdGoal.id,
    })
    .returning({
      effectiveFromPeriodStartAt:
        trainingGoalVersions.effectiveFromPeriodStartAt,
      effectiveUntilPeriodStartAt:
        trainingGoalVersions.effectiveUntilPeriodStartAt,
      targetValue: trainingGoalVersions.targetValue,
      trainingGoalVersionId: trainingGoalVersions.id,
    });

  if (!createdVersion) {
    throw new Error("Failed to create Training Goal Version");
  }

  return {
    ...createdGoal,
    ...createdVersion,
  };
}

export async function findActiveTrainingGoal({
  database = db,
  metric,
  period,
  sportScope,
  userId,
}: {
  database?: TrainingGoalDatabase;
  metric: TrainingGoalMetric;
  period: TrainingGoalPeriod;
  sportScope: TrainingGoalSportScope;
  userId: string;
}) {
  const [trainingGoal] = await database
    .select({ id: trainingGoals.id })
    .from(trainingGoals)
    .where(
      and(
        eq(trainingGoals.userId, userId),
        eq(trainingGoals.metric, metric),
        eq(trainingGoals.period, period),
        eq(trainingGoals.sportScope, sportScope),
        isNull(trainingGoals.archivedAt),
      ),
    )
    .limit(1);

  return trainingGoal ?? null;
}

export async function getActiveTrainingGoal({
  database = db,
  id,
  userId,
}: {
  database?: TrainingGoalDatabase;
  id: number;
  userId: string;
}): Promise<TrainingGoal | null> {
  const [goal] = await database
    .select({
      archivedAt: trainingGoals.archivedAt,
      createdAt: trainingGoals.createdAt,
      effectiveFromPeriodStartAt:
        trainingGoalVersions.effectiveFromPeriodStartAt,
      effectiveUntilPeriodStartAt:
        trainingGoalVersions.effectiveUntilPeriodStartAt,
      id: trainingGoals.id,
      metric: trainingGoals.metric,
      period: trainingGoals.period,
      sportScope: trainingGoals.sportScope,
      targetValue: trainingGoalVersions.targetValue,
      trainingGoalVersionId: trainingGoalVersions.id,
      updatedAt: trainingGoals.updatedAt,
    })
    .from(trainingGoals)
    .innerJoin(
      trainingGoalVersions,
      and(
        eq(trainingGoalVersions.trainingGoalId, trainingGoals.id),
        isNull(trainingGoalVersions.effectiveUntilPeriodStartAt),
      ),
    )
    .where(
      and(
        eq(trainingGoals.id, id),
        eq(trainingGoals.userId, userId),
        isNull(trainingGoals.archivedAt),
      ),
    )
    .limit(1);

  return goal ?? null;
}

export async function listTrainingGoals({
  userId,
}: {
  userId: string;
}): Promise<TrainingGoal[]> {
  return db
    .select({
      archivedAt: trainingGoals.archivedAt,
      createdAt: trainingGoals.createdAt,
      effectiveFromPeriodStartAt:
        trainingGoalVersions.effectiveFromPeriodStartAt,
      effectiveUntilPeriodStartAt:
        trainingGoalVersions.effectiveUntilPeriodStartAt,
      id: trainingGoals.id,
      metric: trainingGoals.metric,
      period: trainingGoals.period,
      sportScope: trainingGoals.sportScope,
      targetValue: trainingGoalVersions.targetValue,
      trainingGoalVersionId: trainingGoalVersions.id,
      updatedAt: trainingGoals.updatedAt,
    })
    .from(trainingGoals)
    .innerJoin(
      trainingGoalVersions,
      and(
        eq(trainingGoalVersions.trainingGoalId, trainingGoals.id),
        isNull(trainingGoalVersions.effectiveUntilPeriodStartAt),
      ),
    )
    .where(eq(trainingGoals.userId, userId))
    .orderBy(trainingGoals.period, trainingGoals.metric);
}

export async function listActiveTrainingGoalVersions({
  userId,
}: {
  userId: string;
}): Promise<TrainingGoal[]> {
  return db
    .select({
      archivedAt: trainingGoals.archivedAt,
      createdAt: trainingGoals.createdAt,
      effectiveFromPeriodStartAt:
        trainingGoalVersions.effectiveFromPeriodStartAt,
      effectiveUntilPeriodStartAt:
        trainingGoalVersions.effectiveUntilPeriodStartAt,
      id: trainingGoals.id,
      metric: trainingGoals.metric,
      period: trainingGoals.period,
      sportScope: trainingGoals.sportScope,
      targetValue: trainingGoalVersions.targetValue,
      trainingGoalVersionId: trainingGoalVersions.id,
      updatedAt: trainingGoals.updatedAt,
    })
    .from(trainingGoals)
    .innerJoin(
      trainingGoalVersions,
      eq(trainingGoalVersions.trainingGoalId, trainingGoals.id),
    )
    .where(
      and(eq(trainingGoals.userId, userId), isNull(trainingGoals.archivedAt)),
    )
    .orderBy(
      trainingGoals.period,
      trainingGoals.metric,
      trainingGoalVersions.effectiveFromPeriodStartAt,
    );
}

export async function closeTrainingGoalVersion({
  database,
  effectiveUntilPeriodStartAt,
  trainingGoalVersionId,
}: {
  database: TrainingGoalDatabase;
  effectiveUntilPeriodStartAt: Date;
  trainingGoalVersionId: number;
}) {
  await database
    .update(trainingGoalVersions)
    .set({
      effectiveUntilPeriodStartAt,
      updatedAt: new Date(),
    })
    .where(eq(trainingGoalVersions.id, trainingGoalVersionId));
}

export async function deletePendingTrainingGoalVersions({
  database,
  effectiveFromPeriodStartAt,
  trainingGoalId,
}: {
  database: TrainingGoalDatabase;
  effectiveFromPeriodStartAt: Date;
  trainingGoalId: number;
}) {
  await database
    .delete(trainingGoalVersions)
    .where(
      and(
        eq(trainingGoalVersions.trainingGoalId, trainingGoalId),
        gte(
          trainingGoalVersions.effectiveFromPeriodStartAt,
          effectiveFromPeriodStartAt,
        ),
      ),
    );
}

export async function createTrainingGoalVersion({
  database,
  effectiveFromPeriodStartAt,
  targetValue,
  trainingGoalId,
}: {
  database: TrainingGoalDatabase;
  effectiveFromPeriodStartAt: Date;
  targetValue: number;
  trainingGoalId: number;
}) {
  const [version] = await database
    .insert(trainingGoalVersions)
    .values({
      effectiveFromPeriodStartAt,
      targetValue,
      trainingGoalId,
    })
    .returning({
      effectiveFromPeriodStartAt:
        trainingGoalVersions.effectiveFromPeriodStartAt,
      effectiveUntilPeriodStartAt:
        trainingGoalVersions.effectiveUntilPeriodStartAt,
      targetValue: trainingGoalVersions.targetValue,
      trainingGoalVersionId: trainingGoalVersions.id,
    });

  if (!version) {
    throw new Error("Failed to create Training Goal Version");
  }

  return version;
}

export async function archiveTrainingGoalRecord({
  archivedAt,
  database,
  trainingGoalId,
}: {
  archivedAt: Date;
  database: TrainingGoalDatabase;
  trainingGoalId: number;
}) {
  await database
    .update(trainingGoals)
    .set({
      archivedAt,
      updatedAt: new Date(),
    })
    .where(eq(trainingGoals.id, trainingGoalId));
}

export async function calculateTrainingGoalActivityCount({
  periodEndAt,
  periodStartAt,
  sportTypes,
  userId,
}: {
  periodEndAt: Date;
  periodStartAt: Date;
  sportTypes: readonly SportType[];
  userId: string;
}) {
  const [row] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        inArray(activities.sportType, sportTypes),
        gte(activities.startAt, periodStartAt),
        lt(activities.startAt, periodEndAt),
      ),
    );

  return row?.value ?? 0;
}

export async function calculateTrainingGoalDistanceMeters({
  periodEndAt,
  periodStartAt,
  sportTypes,
  userId,
}: {
  periodEndAt: Date;
  periodStartAt: Date;
  sportTypes: readonly SportType[];
  userId: string;
}) {
  const [row] = await db
    .select({
      value: sql<number>`coalesce(sum(${activities.distanceMeters}), 0)`,
    })
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        inArray(activities.sportType, sportTypes),
        gte(activities.startAt, periodStartAt),
        lt(activities.startAt, periodEndAt),
      ),
    );

  return row?.value ?? 0;
}
