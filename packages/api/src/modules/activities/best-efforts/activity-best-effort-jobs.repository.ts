import { activityBestEffortCalculationJobs, db } from "@korex/db";
import {
  createDurableJobRepository,
  getDurableJobPendingState,
} from "../../durable-jobs/durable-job-repository";

type ActivityBestEffortJobDatabase = Pick<
  typeof db,
  "insert" | "select" | "transaction" | "update"
>;

export type ActivityBestEffortCalculationJob = {
  activityId: number;
  attemptCount: number;
  id: number;
};

const durableJobRepository =
  createDurableJobRepository<ActivityBestEffortCalculationJob>({
    mapClaimedJob: (row) => ({
      activityId: Number(row.activityId),
      attemptCount: Number(row.attemptCount),
      id: Number(row.id),
    }),
    returning: {
      activityId: activityBestEffortCalculationJobs.activityId,
      attemptCount: activityBestEffortCalculationJobs.attemptCount,
      id: activityBestEffortCalculationJobs.id,
    },
    table: activityBestEffortCalculationJobs,
  });

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
      ...getDurableJobPendingState(now),
    })
    .onConflictDoUpdate({
      target: [activityBestEffortCalculationJobs.activityId],
      set: {
        ...getDurableJobPendingState(now),
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
  return durableJobRepository.claim({
    batchSize,
    now,
    staleLockedBefore,
    workerId,
  });
}

export async function markActivityBestEffortCalculationSucceeded({
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

export async function markActivityBestEffortCalculationFailed({
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
