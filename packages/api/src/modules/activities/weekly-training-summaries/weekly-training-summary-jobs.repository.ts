import { activities, db, weeklyTrainingSummaryGenerationJobs } from "@korex/db";
import { and, eq, gte, isNull, lt } from "drizzle-orm";
import {
  createDurableJobRepository,
  getDurableJobPendingState,
} from "../../durable-jobs/durable-job-repository";

const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000;

type WeeklyTrainingSummaryJobDatabase = Pick<
  typeof db,
  "insert" | "select" | "transaction" | "update"
>;

export type WeeklyTrainingSummaryGenerationJob = {
  attemptCount: number;
  id: number;
  userId: string;
  weekStartAt: Date;
};

const durableJobRepository =
  createDurableJobRepository<WeeklyTrainingSummaryGenerationJob>({
    mapClaimedJob: (row) => ({
      attemptCount: Number(row.attemptCount),
      id: Number(row.id),
      userId: String(row.userId),
      weekStartAt:
        row.weekStartAt instanceof Date
          ? row.weekStartAt
          : new Date(String(row.weekStartAt)),
    }),
    returning: {
      attemptCount: weeklyTrainingSummaryGenerationJobs.attemptCount,
      id: weeklyTrainingSummaryGenerationJobs.id,
      userId: weeklyTrainingSummaryGenerationJobs.userId,
      weekStartAt: weeklyTrainingSummaryGenerationJobs.weekStartAt,
    },
    table: weeklyTrainingSummaryGenerationJobs,
  });

export async function enqueueWeeklyTrainingSummaryGeneration({
  database = db,
  userId,
  weekStartAt,
}: {
  database?: WeeklyTrainingSummaryJobDatabase;
  userId: string;
  weekStartAt: Date;
}) {
  const now = new Date();

  await database
    .insert(weeklyTrainingSummaryGenerationJobs)
    .values({
      ...getDurableJobPendingState(now),
      userId,
      weekStartAt,
    })
    .onConflictDoUpdate({
      target: [
        weeklyTrainingSummaryGenerationJobs.userId,
        weeklyTrainingSummaryGenerationJobs.weekStartAt,
      ],
      set: {
        ...getDurableJobPendingState(now),
        updatedAt: now,
      },
    });
}

export async function listUsersWithActivitiesForTrainingWeek({
  skipSucceeded = false,
  weekEndAt,
  weekStartAt,
}: {
  skipSucceeded?: boolean;
  weekEndAt: Date;
  weekStartAt: Date;
}) {
  const activityWeekCondition = and(
    gte(activities.startAt, weekStartAt),
    lt(activities.startAt, weekEndAt),
  );
  const usersQuery = db
    .selectDistinct({ userId: activities.userId })
    .from(activities);

  const users = skipSucceeded
    ? await usersQuery
        .leftJoin(
          weeklyTrainingSummaryGenerationJobs,
          and(
            eq(weeklyTrainingSummaryGenerationJobs.userId, activities.userId),
            eq(weeklyTrainingSummaryGenerationJobs.weekStartAt, weekStartAt),
            eq(weeklyTrainingSummaryGenerationJobs.status, "succeeded"),
          ),
        )
        .where(
          and(
            activityWeekCondition,
            isNull(weeklyTrainingSummaryGenerationJobs.id),
          ),
        )
    : await usersQuery.where(activityWeekCondition);

  return users.map((user) => user.userId);
}

export async function claimWeeklyTrainingSummaryGenerationJobs({
  batchSize,
  now = new Date(),
  staleLockedBefore,
  workerId,
}: {
  batchSize: number;
  now?: Date;
  staleLockedBefore: Date;
  workerId: string;
}): Promise<WeeklyTrainingSummaryGenerationJob[]> {
  return durableJobRepository.claim({
    batchSize,
    now,
    staleLockedBefore,
    workerId,
  });
}

export async function markWeeklyTrainingSummaryGenerationSucceeded({
  jobId,
  now = new Date(),
}: {
  jobId: number;
  now?: Date;
}) {
  await durableJobRepository.markSucceeded({
    jobId,
    now,
  });
}

export async function markWeeklyTrainingSummaryGenerationFailed({
  error,
  jobId,
  now = new Date(),
}: {
  error: string;
  jobId: number;
  now?: Date;
}) {
  await durableJobRepository.markFailed({
    error,
    jobId,
    now,
  });
}

export function getTrainingWeekEndAt(weekStartAt: Date) {
  return new Date(weekStartAt.getTime() + millisecondsPerWeek);
}
