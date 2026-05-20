import { Context, type Effect } from "effect";
import type {
  ActivityHeartRateZoneSnapshotInput,
  ActivityStreamInput,
} from "../activities.types";
import type { replaceActivityStreams } from "../artifacts/activity-artifacts.repository";
import type { enqueueActivityBestEffortCalculation } from "../best-efforts/activity-best-effort-jobs.repository";
import type {
  clearActivityHeartRateZoneCalculation,
  clearActivityHeartRateZoneTimes,
  getActivityHeartRateZoneCalculationInputs,
  listUserHeartRateZoneSnapshots,
  replaceActivityHeartRateZoneSnapshots,
  replaceActivityHeartRateZoneTimes,
} from "./activity-heart-rate-zone-time.repository";
import type { ActivityHeartRateZoneTimeCalculationJob } from "./activity-heart-rate-zone-time-jobs.repository";

export type ActivityHeartRateZoneTimeDatabase = NonNullable<
  Parameters<typeof replaceActivityHeartRateZoneSnapshots>[0]["database"]
>;

export type ActivityStreamsRepositoryService = {
  replaceActivityStreams: (
    input: Omit<Parameters<typeof replaceActivityStreams>[0], "database"> & {
      database?: ActivityHeartRateZoneTimeDatabase;
    },
  ) => Promise<void>;
};

export class ActivityStreamsRepository extends Context.Tag(
  "ActivityStreamsRepository",
)<ActivityStreamsRepository, ActivityStreamsRepositoryService>() {}

export type ActivityBestEffortJobRepositoryService = {
  enqueueActivityBestEffortCalculation: (
    input: Omit<
      Parameters<typeof enqueueActivityBestEffortCalculation>[0],
      "database"
    > & { database?: ActivityHeartRateZoneTimeDatabase },
  ) => Promise<void>;
};

export class ActivityBestEffortJobRepository extends Context.Tag(
  "HeartRateZoneBestEffortJobRepository",
)<ActivityBestEffortJobRepository, ActivityBestEffortJobRepositoryService>() {}

export type HeartRateZoneSnapshotRepositoryService = {
  clearActivityHeartRateZoneCalculation: (
    input: Omit<
      Parameters<typeof clearActivityHeartRateZoneCalculation>[0],
      "database"
    > & { database?: ActivityHeartRateZoneTimeDatabase },
  ) => Promise<void>;
  clearActivityHeartRateZoneTimes: (
    input: Omit<
      Parameters<typeof clearActivityHeartRateZoneTimes>[0],
      "database"
    > & { database?: ActivityHeartRateZoneTimeDatabase },
  ) => Promise<void>;
  getActivityHeartRateZoneCalculationInputs: (
    input: Parameters<typeof getActivityHeartRateZoneCalculationInputs>[0],
  ) => ReturnType<typeof getActivityHeartRateZoneCalculationInputs>;
  listUserHeartRateZoneSnapshots: (
    input: Omit<
      Parameters<typeof listUserHeartRateZoneSnapshots>[0],
      "database"
    > & { database?: ActivityHeartRateZoneTimeDatabase },
  ) => ReturnType<typeof listUserHeartRateZoneSnapshots>;
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
  deleteActivityHeartRateZoneTimeCalculationJob: (input: {
    activityId: number;
    database?: ActivityHeartRateZoneTimeDatabase;
  }) => Promise<void>;
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
  replaceActivityStreamsAndQueueHeartRateZoneTimeCalculation: (input: {
    activityId: number;
    streams: ActivityStreamInput[];
    userId: string;
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
