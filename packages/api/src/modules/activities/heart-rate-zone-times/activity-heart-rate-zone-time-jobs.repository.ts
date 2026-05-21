import { activityHeartRateZoneTimeCalculationJobs, db } from "@korex/db";
import { and, asc, eq, lt, lte, or } from "drizzle-orm";
import {
  durableJobMaxRetryAttempts,
  getDurableJobFailureState,
} from "../../durable-jobs/durable-job-policy";

type ActivityHeartRateZoneTimeJobDatabase = Pick<
  typeof db,
  "delete" | "insert" | "select" | "transaction" | "update"
>;

export type ActivityHeartRateZoneTimeCalculationJob = {
  activityId: number;
  attemptCount: number;
  id: number;
};

export async function enqueueActivityHeartRateZoneTimeCalculation({
  activityId,
  database = db,
}: {
  activityId: number;
  database?: ActivityHeartRateZoneTimeJobDatabase;
}) {
  const now = new Date();

  await database
    .insert(activityHeartRateZoneTimeCalculationJobs)
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
      target: [activityHeartRateZoneTimeCalculationJobs.activityId],
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

export async function deleteActivityHeartRateZoneTimeCalculationJob({
  activityId,
  database = db,
}: {
  activityId: number;
  database?: ActivityHeartRateZoneTimeJobDatabase;
}) {
  await database
    .delete(activityHeartRateZoneTimeCalculationJobs)
    .where(eq(activityHeartRateZoneTimeCalculationJobs.activityId, activityId));
}

export async function claimActivityHeartRateZoneTimeCalculationJobs({
  batchSize,
  now = new Date(),
  staleLockedBefore,
  workerId,
}: {
  batchSize: number;
  now?: Date;
  staleLockedBefore: Date;
  workerId: string;
}): Promise<ActivityHeartRateZoneTimeCalculationJob[]> {
  return db.transaction(async (tx) => {
    const claimableCondition = or(
      eq(activityHeartRateZoneTimeCalculationJobs.status, "pending"),
      and(
        eq(activityHeartRateZoneTimeCalculationJobs.status, "failed"),
        lt(
          activityHeartRateZoneTimeCalculationJobs.attemptCount,
          durableJobMaxRetryAttempts,
        ),
        lte(activityHeartRateZoneTimeCalculationJobs.runAfter, now),
      ),
      and(
        eq(activityHeartRateZoneTimeCalculationJobs.status, "processing"),
        lte(
          activityHeartRateZoneTimeCalculationJobs.lockedAt,
          staleLockedBefore,
        ),
      ),
    );

    const claimableJobs = await tx
      .select({
        id: activityHeartRateZoneTimeCalculationJobs.id,
      })
      .from(activityHeartRateZoneTimeCalculationJobs)
      .where(claimableCondition)
      .orderBy(asc(activityHeartRateZoneTimeCalculationJobs.runAfter))
      .limit(batchSize);

    if (claimableJobs.length === 0) {
      return [];
    }

    const claimed: ActivityHeartRateZoneTimeCalculationJob[] = [];

    for (const job of claimableJobs) {
      const [updated] = await tx
        .update(activityHeartRateZoneTimeCalculationJobs)
        .set({
          lockedAt: now,
          lockedBy: workerId,
          status: "processing",
          updatedAt: now,
        })
        .where(
          and(
            eq(activityHeartRateZoneTimeCalculationJobs.id, job.id),
            claimableCondition,
          ),
        )
        .returning({
          activityId: activityHeartRateZoneTimeCalculationJobs.activityId,
          attemptCount: activityHeartRateZoneTimeCalculationJobs.attemptCount,
          id: activityHeartRateZoneTimeCalculationJobs.id,
        });

      if (updated) {
        claimed.push(updated);
      }
    }

    return claimed;
  });
}

export async function markActivityHeartRateZoneTimeCalculationSucceeded({
  jobId,
  now = new Date(),
}: {
  jobId: number;
  now?: Date;
}) {
  await db
    .update(activityHeartRateZoneTimeCalculationJobs)
    .set({
      finishedAt: now,
      lastError: null,
      lockedAt: null,
      lockedBy: null,
      status: "succeeded",
      updatedAt: now,
    })
    .where(eq(activityHeartRateZoneTimeCalculationJobs.id, jobId));
}

export async function markActivityHeartRateZoneTimeCalculationFailed({
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
      attemptCount: activityHeartRateZoneTimeCalculationJobs.attemptCount,
    })
    .from(activityHeartRateZoneTimeCalculationJobs)
    .where(eq(activityHeartRateZoneTimeCalculationJobs.id, jobId));

  if (!job) {
    return;
  }

  await db
    .update(activityHeartRateZoneTimeCalculationJobs)
    .set(
      getDurableJobFailureState({ attemptCount: job.attemptCount, error, now }),
    )
    .where(eq(activityHeartRateZoneTimeCalculationJobs.id, jobId));
}
