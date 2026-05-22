import {
  activities,
  activityMaps,
  activityRouteHeatmapCalculationJobs,
  activityRouteHeatmapContributions,
  db,
} from "@korex/db";
import { and, eq, isNull } from "drizzle-orm";
import {
  createDurableJobRepository,
  getDurableJobPendingState,
} from "../../durable-jobs/durable-job-repository";

type ActivityRouteHeatmapJobDatabase = Pick<
  typeof db,
  "insert" | "select" | "transaction" | "update"
>;

export type ActivityRouteHeatmapCalculationJob = {
  activityId: number;
  attemptCount: number;
  id: number;
};

const durableJobRepository =
  createDurableJobRepository<ActivityRouteHeatmapCalculationJob>({
    mapClaimedJob: (row) => ({
      activityId: Number(row.activityId),
      attemptCount: Number(row.attemptCount),
      id: Number(row.id),
    }),
    returning: {
      activityId: activityRouteHeatmapCalculationJobs.activityId,
      attemptCount: activityRouteHeatmapCalculationJobs.attemptCount,
      id: activityRouteHeatmapCalculationJobs.id,
    },
    table: activityRouteHeatmapCalculationJobs,
  });

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
      ...getDurableJobPendingState(now),
    })
    .onConflictDoUpdate({
      target: [activityRouteHeatmapCalculationJobs.activityId],
      set: {
        ...getDurableJobPendingState(now),
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
  return durableJobRepository.claim({
    batchSize,
    now,
    staleLockedBefore,
    workerId,
  });
}

export async function markActivityRouteHeatmapCalculationSucceeded({
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

export async function markActivityRouteHeatmapCalculationFailed({
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
