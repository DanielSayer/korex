import { activities, db, weeklyTrainingSummaryGenerationJobs } from "@korex/db";
import { and, asc, eq, gte, isNull, lt, lte, or } from "drizzle-orm";
import { getCompletedTrainingWeek } from "./training-week";

const retryDelaysSeconds = [1, 2, 4] as const;
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
      attemptCount: 0,
      finishedAt: null,
      lastError: null,
      lockedAt: null,
      lockedBy: null,
      runAfter: now,
      status: "pending",
      userId,
      weekStartAt,
    })
    .onConflictDoUpdate({
      target: [
        weeklyTrainingSummaryGenerationJobs.userId,
        weeklyTrainingSummaryGenerationJobs.weekStartAt,
      ],
      set: {
        attemptCount: 0,
        finishedAt: null,
        lastError: null,
        lockedAt: null,
        lockedBy: null,
        runAfter: now,
        status: "pending",
        updatedAt: now,
      },
    });
}

export async function enqueueCompletedWeeklyTrainingSummaries({
  now = new Date(),
  skipSucceeded = false,
}: {
  now?: Date;
  skipSucceeded?: boolean;
} = {}) {
  const { weekEndAt, weekStartAt } = getCompletedTrainingWeek(now);
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

  for (const { userId } of users) {
    await enqueueWeeklyTrainingSummaryGeneration({
      userId,
      weekStartAt,
    });
  }

  return {
    enqueued: users.length,
    weekEndAt,
    weekStartAt,
  };
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
  return db.transaction(async (tx) => {
    const claimableCondition = or(
      eq(weeklyTrainingSummaryGenerationJobs.status, "pending"),
      and(
        eq(weeklyTrainingSummaryGenerationJobs.status, "failed"),
        lt(
          weeklyTrainingSummaryGenerationJobs.attemptCount,
          retryDelaysSeconds.length,
        ),
        lte(weeklyTrainingSummaryGenerationJobs.runAfter, now),
      ),
      and(
        eq(weeklyTrainingSummaryGenerationJobs.status, "processing"),
        lte(weeklyTrainingSummaryGenerationJobs.lockedAt, staleLockedBefore),
      ),
    );

    const claimableJobs = await tx
      .select({
        id: weeklyTrainingSummaryGenerationJobs.id,
      })
      .from(weeklyTrainingSummaryGenerationJobs)
      .where(claimableCondition)
      .orderBy(asc(weeklyTrainingSummaryGenerationJobs.runAfter))
      .limit(batchSize);

    if (claimableJobs.length === 0) {
      return [];
    }

    const claimed: WeeklyTrainingSummaryGenerationJob[] = [];

    for (const job of claimableJobs) {
      const [updated] = await tx
        .update(weeklyTrainingSummaryGenerationJobs)
        .set({
          lockedAt: now,
          lockedBy: workerId,
          status: "processing",
          updatedAt: now,
        })
        .where(
          and(
            eq(weeklyTrainingSummaryGenerationJobs.id, job.id),
            claimableCondition,
          ),
        )
        .returning({
          attemptCount: weeklyTrainingSummaryGenerationJobs.attemptCount,
          id: weeklyTrainingSummaryGenerationJobs.id,
          userId: weeklyTrainingSummaryGenerationJobs.userId,
          weekStartAt: weeklyTrainingSummaryGenerationJobs.weekStartAt,
        });

      if (updated) {
        claimed.push(updated);
      }
    }

    return claimed;
  });
}

export async function markWeeklyTrainingSummaryGenerationSucceeded({
  jobId,
  now = new Date(),
}: {
  jobId: number;
  now?: Date;
}) {
  await db
    .update(weeklyTrainingSummaryGenerationJobs)
    .set({
      finishedAt: now,
      lastError: null,
      lockedAt: null,
      lockedBy: null,
      status: "succeeded",
      updatedAt: now,
    })
    .where(eq(weeklyTrainingSummaryGenerationJobs.id, jobId));
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
  const [job] = await db
    .select({
      attemptCount: weeklyTrainingSummaryGenerationJobs.attemptCount,
    })
    .from(weeklyTrainingSummaryGenerationJobs)
    .where(eq(weeklyTrainingSummaryGenerationJobs.id, jobId));

  if (!job) {
    return;
  }

  const attemptCount = job.attemptCount + 1;
  const retryDelaySeconds = retryDelaysSeconds[attemptCount - 1];

  await db
    .update(weeklyTrainingSummaryGenerationJobs)
    .set({
      attemptCount,
      lastError: error,
      lockedAt: null,
      lockedBy: null,
      runAfter:
        retryDelaySeconds === undefined
          ? now
          : new Date(now.getTime() + retryDelaySeconds * 1000),
      status: "failed",
      updatedAt: now,
    })
    .where(eq(weeklyTrainingSummaryGenerationJobs.id, jobId));
}

export function getTrainingWeekEndAt(weekStartAt: Date) {
  return new Date(weekStartAt.getTime() + millisecondsPerWeek);
}
