import { Effect } from "effect";
import type { WeeklyTrainingSummaryGenerationJob } from "./weekly-training-summary-jobs.repository";
import {
  type EnqueueCompletedWeeklyTrainingSummariesInput,
  type RunWeeklyTrainingSummaryWorkerOnceInput,
  WeeklyTrainingSummaryWorkflow,
} from "./weekly-training-summary-workflow.dependencies";

export function enqueueCompletedWeeklyTrainingSummaries(
  input: EnqueueCompletedWeeklyTrainingSummariesInput = {},
) {
  return Effect.gen(function* () {
    const workflow = yield* WeeklyTrainingSummaryWorkflow;

    return yield* workflow.enqueueCompletedWeeklyTrainingSummaries(input);
  });
}

export function processWeeklyTrainingSummaryGenerationJob(
  job: WeeklyTrainingSummaryGenerationJob,
) {
  return Effect.gen(function* () {
    const workflow = yield* WeeklyTrainingSummaryWorkflow;

    return yield* workflow.processWeeklyTrainingSummaryGenerationJob(job);
  });
}

export function runWeeklyTrainingSummaryWorkerOnce(
  input: RunWeeklyTrainingSummaryWorkerOnceInput,
) {
  return Effect.gen(function* () {
    const workflow = yield* WeeklyTrainingSummaryWorkflow;

    return yield* workflow.runWeeklyTrainingSummaryWorkerOnce(input);
  });
}
