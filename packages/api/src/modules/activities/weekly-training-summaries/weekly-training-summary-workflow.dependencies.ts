import { Context, type Effect } from "effect";
import type { WeeklyTrainingSummaryGenerationJob } from "./weekly-training-summary-jobs.repository";

export type EnqueueCompletedWeeklyTrainingSummariesInput = {
  now?: Date;
  skipSucceeded?: boolean;
};

export type EnqueueCompletedWeeklyTrainingSummariesResult = {
  enqueued: number;
  weekEndAt: Date;
  weekStartAt: Date;
};

export type RunWeeklyTrainingSummaryWorkerOnceInput = {
  batchSize: number;
  now?: Date;
  staleLockMs: number;
  workerId: string;
};

export type WeeklyTrainingSummaryWorkflowService = {
  enqueueCompletedWeeklyTrainingSummaries: (
    input?: EnqueueCompletedWeeklyTrainingSummariesInput,
  ) => Effect.Effect<EnqueueCompletedWeeklyTrainingSummariesResult>;
  processWeeklyTrainingSummaryGenerationJob: (
    job: WeeklyTrainingSummaryGenerationJob,
  ) => Effect.Effect<void>;
  runWeeklyTrainingSummaryWorkerOnce: (
    input: RunWeeklyTrainingSummaryWorkerOnceInput,
  ) => Effect.Effect<{ processed: number }>;
};

export class WeeklyTrainingSummaryWorkflow extends Context.Tag(
  "WeeklyTrainingSummaryWorkflow",
)<WeeklyTrainingSummaryWorkflow, WeeklyTrainingSummaryWorkflowService>() {}
