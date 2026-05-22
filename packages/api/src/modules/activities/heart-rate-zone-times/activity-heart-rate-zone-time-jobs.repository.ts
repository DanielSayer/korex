import { activityHeartRateZoneTimeCalculationJobs, db } from "@korex/db";
import { eq } from "drizzle-orm";
import {
  createDurableJobRepository,
  getDurableJobPendingState,
} from "../../durable-jobs/durable-job-repository";

type ActivityHeartRateZoneTimeJobDatabase = Pick<
  typeof db,
  "delete" | "insert" | "select" | "transaction" | "update"
>;

export type ActivityHeartRateZoneTimeCalculationJob = {
  activityId: number;
  attemptCount: number;
  id: number;
};

const durableJobRepository =
  createDurableJobRepository<ActivityHeartRateZoneTimeCalculationJob>({
    mapClaimedJob: (row) => ({
      activityId: Number(row.activityId),
      attemptCount: Number(row.attemptCount),
      id: Number(row.id),
    }),
    returning: {
      activityId: activityHeartRateZoneTimeCalculationJobs.activityId,
      attemptCount: activityHeartRateZoneTimeCalculationJobs.attemptCount,
      id: activityHeartRateZoneTimeCalculationJobs.id,
    },
    table: activityHeartRateZoneTimeCalculationJobs,
  });

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
      ...getDurableJobPendingState(now),
    })
    .onConflictDoUpdate({
      target: [activityHeartRateZoneTimeCalculationJobs.activityId],
      set: {
        ...getDurableJobPendingState(now),
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
  return durableJobRepository.claim({
    batchSize,
    now,
    staleLockedBefore,
    workerId,
  });
}

export async function markActivityHeartRateZoneTimeCalculationSucceeded({
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

export async function markActivityHeartRateZoneTimeCalculationFailed({
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
