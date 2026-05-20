import { Context, type Effect } from "effect";
import type { ActivityBestEffortCalculationJob } from "./activity-best-effort-jobs.repository";

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
