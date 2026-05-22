import { db, trainingStreaks, trainingStreakUpdateJobs } from "@korex/db";
import { and, gt, isNotNull, lt } from "drizzle-orm";
import {
  createDurableJobRepository,
  getDurableJobPendingState,
} from "../../durable-jobs/durable-job-repository";
import { getCompletedTrainingWeek } from "../weekly-training-summaries/training-week";

type TrainingStreakJobDatabase = Pick<
  typeof db,
  "insert" | "select" | "transaction" | "update"
>;

export type TrainingStreakUpdateJob = {
  attemptCount: number;
  id: number;
  userId: string;
  weekStartAt: Date;
};

const durableJobRepository =
  createDurableJobRepository<TrainingStreakUpdateJob>({
    mapClaimedJob: (row) => ({
      attemptCount: Number(row.attemptCount),
      id: Number(row.id),
      userId: String(row.userId),
      weekStartAt: row.weekStartAt as Date,
    }),
    returning: {
      attemptCount: trainingStreakUpdateJobs.attemptCount,
      id: trainingStreakUpdateJobs.id,
      userId: trainingStreakUpdateJobs.userId,
      weekStartAt: trainingStreakUpdateJobs.weekStartAt,
    },
    table: trainingStreakUpdateJobs,
  });

export async function enqueueTrainingStreakUpdate({
  database = db,
  userId,
  weekStartAt,
}: {
  database?: TrainingStreakJobDatabase;
  userId: string;
  weekStartAt: Date;
}) {
  const now = new Date();

  await database
    .insert(trainingStreakUpdateJobs)
    .values({
      userId,
      weekStartAt,
      ...getDurableJobPendingState(now),
    })
    .onConflictDoUpdate({
      target: [
        trainingStreakUpdateJobs.userId,
        trainingStreakUpdateJobs.weekStartAt,
      ],
      set: {
        ...getDurableJobPendingState(now),
        updatedAt: now,
      },
    });
}

export async function enqueueCompletedTrainingStreakUpdates({
  now = new Date(),
}: {
  now?: Date;
} = {}) {
  const { weekStartAt } = getCompletedTrainingWeek(now);
  const activeStreaks = await db
    .select({ userId: trainingStreaks.userId })
    .from(trainingStreaks)
    .where(
      and(
        gt(trainingStreaks.currentStreak, 0),
        isNotNull(trainingStreaks.lastQualifiedWeekStartAt),
        lt(trainingStreaks.lastQualifiedWeekStartAt, weekStartAt),
      ),
    );

  for (const streak of activeStreaks) {
    await enqueueTrainingStreakUpdate({
      userId: streak.userId,
      weekStartAt,
    });
  }

  return {
    enqueued: activeStreaks.length,
    weekStartAt,
  };
}

export async function claimTrainingStreakUpdateJobs({
  batchSize,
  now = new Date(),
  staleLockedBefore,
  workerId,
}: {
  batchSize: number;
  now?: Date;
  staleLockedBefore: Date;
  workerId: string;
}): Promise<TrainingStreakUpdateJob[]> {
  return durableJobRepository.claim({
    batchSize,
    now,
    staleLockedBefore,
    workerId,
  });
}

export async function markTrainingStreakUpdateSucceeded({
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

export async function markTrainingStreakUpdateFailed({
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
