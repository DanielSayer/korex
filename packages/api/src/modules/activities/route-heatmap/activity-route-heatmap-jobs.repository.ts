import {
  activities,
  activityMaps,
  activityRouteHeatmapCalculationJobs,
  activityRouteHeatmapContributions,
  db,
} from "@korex/db";
import { and, asc, eq, isNull, lt, lte, or } from "drizzle-orm";
import {
  durableJobMaxRetryAttempts,
  getDurableJobFailureState,
} from "../../durable-jobs/durable-job-policy";

type ActivityRouteHeatmapJobDatabase = Pick<
  typeof db,
  "insert" | "select" | "transaction" | "update"
>;

export type ActivityRouteHeatmapCalculationJob = {
  activityId: number;
  attemptCount: number;
  id: number;
};

export async function enqueueActivityRouteHeatmapCalculation({
  activityId,
  database = db,
}: {
  activityId: number;
  database?: ActivityRouteHeatmapJobDatabase;
}) {
  const now = new Date();

  await database
    .insert(activityRouteHeatmapCalculationJobs)
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
      target: [activityRouteHeatmapCalculationJobs.activityId],
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

export async function enqueueMissingActivityRouteHeatmapCalculations({
  batchSize = 100,
}: {
  batchSize?: number;
} = {}) {
  const rows = await db
    .select({
      activityId: activities.id,
    })
    .from(activities)
    .innerJoin(activityMaps, eq(activityMaps.activityId, activities.id))
    .leftJoin(
      activityRouteHeatmapContributions,
      eq(activityRouteHeatmapContributions.activityId, activities.id),
    )
    .where(
      and(
        eq(activities.sportType, "run"),
        isNull(activityRouteHeatmapContributions.id),
      ),
    )
    .limit(batchSize);

  for (const row of rows) {
    await enqueueActivityRouteHeatmapCalculation({
      activityId: row.activityId,
    });
  }

  return {
    enqueued: rows.length,
  };
}

export async function claimActivityRouteHeatmapCalculationJobs({
  batchSize,
  now = new Date(),
  staleLockedBefore,
  workerId,
}: {
  batchSize: number;
  now?: Date;
  staleLockedBefore: Date;
  workerId: string;
}): Promise<ActivityRouteHeatmapCalculationJob[]> {
  return db.transaction(async (tx) => {
    const claimableCondition = or(
      eq(activityRouteHeatmapCalculationJobs.status, "pending"),
      and(
        eq(activityRouteHeatmapCalculationJobs.status, "failed"),
        lt(
          activityRouteHeatmapCalculationJobs.attemptCount,
          durableJobMaxRetryAttempts,
        ),
        lte(activityRouteHeatmapCalculationJobs.runAfter, now),
      ),
      and(
        eq(activityRouteHeatmapCalculationJobs.status, "processing"),
        lte(activityRouteHeatmapCalculationJobs.lockedAt, staleLockedBefore),
      ),
    );

    const claimableJobs = await tx
      .select({
        id: activityRouteHeatmapCalculationJobs.id,
      })
      .from(activityRouteHeatmapCalculationJobs)
      .where(claimableCondition)
      .orderBy(asc(activityRouteHeatmapCalculationJobs.runAfter))
      .limit(batchSize);

    if (claimableJobs.length === 0) {
      return [];
    }

    const claimed: ActivityRouteHeatmapCalculationJob[] = [];

    for (const job of claimableJobs) {
      const [updated] = await tx
        .update(activityRouteHeatmapCalculationJobs)
        .set({
          lockedAt: now,
          lockedBy: workerId,
          status: "processing",
          updatedAt: now,
        })
        .where(
          and(
            eq(activityRouteHeatmapCalculationJobs.id, job.id),
            claimableCondition,
          ),
        )
        .returning({
          activityId: activityRouteHeatmapCalculationJobs.activityId,
          attemptCount: activityRouteHeatmapCalculationJobs.attemptCount,
          id: activityRouteHeatmapCalculationJobs.id,
        });

      if (updated) {
        claimed.push(updated);
      }
    }

    return claimed;
  });
}

export async function markActivityRouteHeatmapCalculationSucceeded({
  jobId,
  now = new Date(),
}: {
  jobId: number;
  now?: Date;
}) {
  await db
    .update(activityRouteHeatmapCalculationJobs)
    .set({
      finishedAt: now,
      lastError: null,
      lockedAt: null,
      lockedBy: null,
      status: "succeeded",
      updatedAt: now,
    })
    .where(eq(activityRouteHeatmapCalculationJobs.id, jobId));
}

export async function markActivityRouteHeatmapCalculationFailed({
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
      attemptCount: activityRouteHeatmapCalculationJobs.attemptCount,
    })
    .from(activityRouteHeatmapCalculationJobs)
    .where(eq(activityRouteHeatmapCalculationJobs.id, jobId));

  if (!job) {
    return;
  }

  await db
    .update(activityRouteHeatmapCalculationJobs)
    .set(
      getDurableJobFailureState({ attemptCount: job.attemptCount, error, now }),
    )
    .where(eq(activityRouteHeatmapCalculationJobs.id, jobId));
}
