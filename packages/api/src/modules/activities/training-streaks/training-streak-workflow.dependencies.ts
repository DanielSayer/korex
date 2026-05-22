import { Context, type Effect } from "effect";
import type {
  getTrainingStreakProjectionInputs,
  upsertTrainingStreak,
} from "./training-streak.repository";
import type { TrainingStreakUpdateJob } from "./training-streak-jobs.repository";

export type TrainingStreakRepositoryService = {
  getTrainingStreakProjectionInputs: (
    input: Parameters<typeof getTrainingStreakProjectionInputs>[0],
  ) => ReturnType<typeof getTrainingStreakProjectionInputs>;
  upsertTrainingStreak: (
    input: Parameters<typeof upsertTrainingStreak>[0],
  ) => ReturnType<typeof upsertTrainingStreak>;
};

export class TrainingStreakRepository extends Context.Tag(
  "TrainingStreakRepository",
)<TrainingStreakRepository, TrainingStreakRepositoryService>() {}

export type TrainingStreakJobRepositoryService = {
  claimTrainingStreakUpdateJobs: (input: {
    batchSize: number;
    now: Date;
    staleLockedBefore: Date;
    workerId: string;
  }) => Promise<TrainingStreakUpdateJob[]>;
  markTrainingStreakUpdateFailed: (input: {
    error: string;
    jobId: number;
    now?: Date;
  }) => Promise<void>;
  markTrainingStreakUpdateSucceeded: (input: {
    jobId: number;
    now?: Date;
  }) => Promise<void>;
};

export class TrainingStreakJobRepository extends Context.Tag(
  "TrainingStreakJobRepository",
)<TrainingStreakJobRepository, TrainingStreakJobRepositoryService>() {}

export type RunTrainingStreakWorkerOnceInput = {
  batchSize: number;
  now?: Date;
  staleLockMs: number;
  workerId: string;
};

export type TrainingStreakWorkflowService = {
  processTrainingStreakUpdateJob: (
    job: TrainingStreakUpdateJob,
  ) => Effect.Effect<void>;
  runTrainingStreakWorkerOnce: (
    input: RunTrainingStreakWorkerOnceInput,
  ) => Effect.Effect<{ processed: number }>;
};

export class TrainingStreakWorkflow extends Context.Tag(
  "TrainingStreakWorkflow",
)<TrainingStreakWorkflow, TrainingStreakWorkflowService>() {}
