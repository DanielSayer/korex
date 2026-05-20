import { Context, type Effect } from "effect";
import type {
  getActivityBestEffortCalculationInputs,
  refreshPersonalBestEfforts,
  replaceActivityBestEfforts,
} from "./activity-best-effort.repository";
import type { ActivityBestEffortCalculationJob } from "./activity-best-effort-jobs.repository";

export type ActivityBestEffortDatabase = NonNullable<
  Parameters<typeof replaceActivityBestEfforts>[0]["database"]
>;

export type ActivityBestEffortRepositoryService = {
  getActivityBestEffortCalculationInputs: (
    input: Parameters<typeof getActivityBestEffortCalculationInputs>[0],
  ) => ReturnType<typeof getActivityBestEffortCalculationInputs>;
  refreshPersonalBestEfforts: (
    input: Omit<
      Parameters<typeof refreshPersonalBestEfforts>[0],
      "database"
    > & { database?: ActivityBestEffortDatabase },
  ) => Promise<void>;
  replaceActivityBestEfforts: (
    input: Omit<
      Parameters<typeof replaceActivityBestEfforts>[0],
      "database"
    > & { database?: ActivityBestEffortDatabase },
  ) => ReturnType<typeof replaceActivityBestEfforts>;
  transaction: <T>(
    work: (database: ActivityBestEffortDatabase) => Promise<T>,
  ) => Promise<T>;
};

export class ActivityBestEffortRepository extends Context.Tag(
  "ActivityBestEffortRepository",
)<ActivityBestEffortRepository, ActivityBestEffortRepositoryService>() {}

export type ActivityBestEffortJobRepositoryService = {
  claimActivityBestEffortCalculationJobs: (input: {
    batchSize: number;
    now: Date;
    staleLockedBefore: Date;
    workerId: string;
  }) => Promise<ActivityBestEffortCalculationJob[]>;
  markActivityBestEffortCalculationFailed: (input: {
    error: string;
    jobId: number;
    now?: Date;
  }) => Promise<void>;
  markActivityBestEffortCalculationSucceeded: (input: {
    jobId: number;
    now?: Date;
  }) => Promise<void>;
};

export class ActivityBestEffortJobRepository extends Context.Tag(
  "ActivityBestEffortJobRepository",
)<ActivityBestEffortJobRepository, ActivityBestEffortJobRepositoryService>() {}

export type RunActivityBestEffortWorkerOnceInput = {
  batchSize: number;
  now?: Date;
  staleLockMs: number;
  workerId: string;
};

export type ActivityBestEffortWorkflowService = {
  processActivityBestEffortCalculationJob: (
    job: ActivityBestEffortCalculationJob,
  ) => Effect.Effect<void>;
  runActivityBestEffortWorkerOnce: (
    input: RunActivityBestEffortWorkerOnceInput,
  ) => Effect.Effect<{ processed: number }>;
};

export class ActivityBestEffortWorkflow extends Context.Tag(
  "ActivityBestEffortWorkflow",
)<ActivityBestEffortWorkflow, ActivityBestEffortWorkflowService>() {}
