import { Context, type Effect } from "effect";
import type {
  listActivitiesForTrainingWeek,
  upsertWeeklyTrainingSummary,
} from "./weekly-training-summary.repository";
import type { WeeklyTrainingSummaryGenerationJob } from "./weekly-training-summary-jobs.repository";

export type WeeklyTrainingSummaryRepositoryService = {
  listActivitiesForTrainingWeek: (
    input: Parameters<typeof listActivitiesForTrainingWeek>[0],
  ) => ReturnType<typeof listActivitiesForTrainingWeek>;
  upsertWeeklyTrainingSummary: (
    input: Parameters<typeof upsertWeeklyTrainingSummary>[0],
  ) => Promise<void>;
};

export class WeeklyTrainingSummaryRepository extends Context.Tag(
  "WeeklyTrainingSummaryRepository",
)<WeeklyTrainingSummaryRepository, WeeklyTrainingSummaryRepositoryService>() {}

export type WeeklyTrainingSummaryJobRepositoryService = {
  claimWeeklyTrainingSummaryGenerationJobs: (input: {
    batchSize: number;
    now: Date;
    staleLockedBefore: Date;
    workerId: string;
  }) => Promise<WeeklyTrainingSummaryGenerationJob[]>;
  enqueueWeeklyTrainingSummaryGeneration: (input: {
    userId: string;
    weekStartAt: Date;
  }) => Promise<void>;
  getTrainingWeekEndAt: (weekStartAt: Date) => Date;
  listUsersWithActivitiesForTrainingWeek: (input: {
    skipSucceeded: boolean;
    weekEndAt: Date;
    weekStartAt: Date;
  }) => Promise<string[]>;
  markWeeklyTrainingSummaryGenerationFailed: (input: {
    error: string;
    jobId: number;
    now?: Date;
  }) => Promise<void>;
  markWeeklyTrainingSummaryGenerationSucceeded: (input: {
    jobId: number;
    now?: Date;
  }) => Promise<void>;
};

export class WeeklyTrainingSummaryJobRepository extends Context.Tag(
  "WeeklyTrainingSummaryJobRepository",
)<
  WeeklyTrainingSummaryJobRepository,
  WeeklyTrainingSummaryJobRepositoryService
>() {}

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
