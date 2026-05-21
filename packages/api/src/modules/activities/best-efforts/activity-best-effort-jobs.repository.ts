import { activityBestEffortCalculationJobs, db } from "@korex/db";
import { and, asc, eq, lt, lte, or } from "drizzle-orm";
import {
  durableJobMaxRetryAttempts,
  getDurableJobFailureState,
} from "../../durable-jobs/durable-job-policy";

type ActivityBestEffortJobDatabase = Pick<
  typeof db,
  "insert" | "select" | "transaction" | "update"
>;

export type ActivityBestEffortCalculationJob = {
  activityId: number;
  attemptCount: number;
  id: number;
};

export async function enqueueActivityBestEffortCalculation({
  activityId,
  database = db,
}: {
  activityId: number;
  database?: ActivityBestEffortJobDatabase;
}) {
  const now = new Date();

  await database
    .insert(activityBestEffortCalculationJobs)
    .values({
      activityId,
      attemptCount: 0,
      finishedAt: null,
      lastError: null,
      lockedAt: null,
      lockedBy: null,
      runAfter: now,
      status: "pending",
    })
    .onConflictDoUpdate({
      target: [activityBestEffortCalculationJobs.activityId],
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

export async function claimActivityBestEffortCalculationJobs({
  batchSize,
  now = new Date(),
  staleLockedBefore,
  workerId,
}: {
  batchSize: number;
  now?: Date;
  staleLockedBefore: Date;
  workerId: string;
}): Promise<ActivityBestEffortCalculationJob[]> {
  return db.transaction(async (tx) => {
    const claimableCondition = or(
      eq(activityBestEffortCalculationJobs.status, "pending"),
      and(
        eq(activityBestEffortCalculationJobs.status, "failed"),
        lt(
          activityBestEffortCalculationJobs.attemptCount,
          durableJobMaxRetryAttempts,
        ),
        lte(activityBestEffortCalculationJobs.runAfter, now),
      ),
      and(
        eq(activityBestEffortCalculationJobs.status, "processing"),
        lte(activityBestEffortCalculationJobs.lockedAt, staleLockedBefore),
      ),
    );

    const claimableJobs = await tx
      .select({ id: activityBestEffortCalculationJobs.id })
      .from(activityBestEffortCalculationJobs)
      .where(claimableCondition)
      .orderBy(asc(activityBestEffortCalculationJobs.runAfter))
      .limit(batchSize);

    if (claimableJobs.length === 0) {
      return [];
    }

    const claimed: ActivityBestEffortCalculationJob[] = [];

    for (const job of claimableJobs) {
      const [updated] = await tx
        .update(activityBestEffortCalculationJobs)
        .set({
          lockedAt: now,
          lockedBy: workerId,
          status: "processing",
          updatedAt: now,
        })
        .where(
          and(
            eq(activityBestEffortCalculationJobs.id, job.id),
            claimableCondition,
          ),
        )
        .returning({
          activityId: activityBestEffortCalculationJobs.activityId,
          attemptCount: activityBestEffortCalculationJobs.attemptCount,
          id: activityBestEffortCalculationJobs.id,
        });

      if (updated) {
        claimed.push(updated);
      }
    }

    return claimed;
  });
}

export async function markActivityBestEffortCalculationSucceeded({
  jobId,
  now = new Date(),
}: {
  jobId: number;
  now?: Date;
}) {
  await db
    .update(activityBestEffortCalculationJobs)
    .set({
      finishedAt: now,
      lastError: null,
      lockedAt: null,
      lockedBy: null,
      status: "succeeded",
      updatedAt: now,
    })
    .where(eq(activityBestEffortCalculationJobs.id, jobId));
}

export async function markActivityBestEffortCalculationFailed({
  error,
  jobId,
  now = new Date(),
}: {
  error: string;
  jobId: number;
  now?: Date;
}) {
  const [job] = await db
    .select({ attemptCount: activityBestEffortCalculationJobs.attemptCount })
    .from(activityBestEffortCalculationJobs)
    .where(eq(activityBestEffortCalculationJobs.id, jobId));

  if (!job) {
    return;
  }

  await db
    .update(activityBestEffortCalculationJobs)
    .set(
      getDurableJobFailureState({ attemptCount: job.attemptCount, error, now }),
    )
    .where(eq(activityBestEffortCalculationJobs.id, jobId));
}
