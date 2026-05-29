import { Context, type Effect } from "effect";
import type { ActivityHeartRateZoneSnapshotInput } from "../activities.types";
import type {
  clearActivityHeartRateZoneTimes,
  getActivityHeartRateZoneCalculationInputs,
  replaceActivityHeartRateZoneSnapshots,
  replaceActivityHeartRateZoneTimes,
} from "./activity-heart-rate-zone-time.repository";
import type { ActivityHeartRateZoneTimeCalculationJob } from "./activity-heart-rate-zone-time-jobs.repository";

export type ActivityHeartRateZoneTimeDatabase = NonNullable<
  Parameters<typeof replaceActivityHeartRateZoneSnapshots>[0]["database"]
>;

export type HeartRateZoneSnapshotRepositoryService = {
  clearActivityHeartRateZoneTimes: (
    input: Omit<
      Parameters<typeof clearActivityHeartRateZoneTimes>[0],
      "database"
    > & { database?: ActivityHeartRateZoneTimeDatabase },
  ) => Promise<void>;
  getActivityHeartRateZoneCalculationInputs: (
    input: Parameters<typeof getActivityHeartRateZoneCalculationInputs>[0],
  ) => ReturnType<typeof getActivityHeartRateZoneCalculationInputs>;
  replaceActivityHeartRateZoneSnapshots: (
    input: Omit<
      Parameters<typeof replaceActivityHeartRateZoneSnapshots>[0],
      "database"
    > & { database?: ActivityHeartRateZoneTimeDatabase },
  ) => Promise<void>;
  replaceActivityHeartRateZoneTimes: (
    input: Parameters<typeof replaceActivityHeartRateZoneTimes>[0],
  ) => Promise<void>;
  transaction: <T>(
    work: (database: ActivityHeartRateZoneTimeDatabase) => Promise<T>,
  ) => Promise<T>;
};

export class HeartRateZoneSnapshotRepository extends Context.Tag(
  "HeartRateZoneSnapshotRepository",
)<HeartRateZoneSnapshotRepository, HeartRateZoneSnapshotRepositoryService>() {}

export type HeartRateZoneTimeJobRepositoryService = {
  claimActivityHeartRateZoneTimeCalculationJobs: (input: {
    batchSize: number;
    now: Date;
    staleLockedBefore: Date;
    workerId: string;
  }) => Promise<ActivityHeartRateZoneTimeCalculationJob[]>;
  enqueueActivityHeartRateZoneTimeCalculation: (input: {
    activityId: number;
    database?: ActivityHeartRateZoneTimeDatabase;
  }) => Promise<void>;
  markActivityHeartRateZoneTimeCalculationFailed: (input: {
    error: string;
    jobId: number;
    now?: Date;
  }) => Promise<void>;
  markActivityHeartRateZoneTimeCalculationSucceeded: (input: {
    jobId: number;
    now?: Date;
  }) => Promise<void>;
};

export class HeartRateZoneTimeJobRepository extends Context.Tag(
  "HeartRateZoneTimeJobRepository",
)<HeartRateZoneTimeJobRepository, HeartRateZoneTimeJobRepositoryService>() {}

export type RunActivityHeartRateZoneTimeWorkerOnceInput = {
  batchSize: number;
  now?: Date;
  staleLockMs: number;
  workerId: string;
};

export type ActivityHeartRateZoneTimeWorkflowService = {
  processActivityHeartRateZoneTimeCalculationJob: (
    job: ActivityHeartRateZoneTimeCalculationJob,
  ) => Effect.Effect<void>;
  replaceActivityHeartRateZoneSnapshotsAndQueueCalculation: (input: {
    activityId: number;
    snapshots: ActivityHeartRateZoneSnapshotInput[];
  }) => Effect.Effect<void>;
  runActivityHeartRateZoneTimeWorkerOnce: (
    input: RunActivityHeartRateZoneTimeWorkerOnceInput,
  ) => Effect.Effect<{ processed: number }>;
};

export class ActivityHeartRateZoneTimeWorkflow extends Context.Tag(
  "ActivityHeartRateZoneTimeWorkflow",
)<
  ActivityHeartRateZoneTimeWorkflow,
  ActivityHeartRateZoneTimeWorkflowService
>() {}
