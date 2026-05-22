import { Effect } from "effect";
import type { TrainingStreakUpdateJob } from "./training-streak-jobs.repository";
import {
  type RunTrainingStreakWorkerOnceInput,
  TrainingStreakWorkflow,
} from "./training-streak-workflow.dependencies";

export function processTrainingStreakUpdateJob(job: TrainingStreakUpdateJob) {
  return Effect.gen(function* () {
    const workflow = yield* TrainingStreakWorkflow;

    return yield* workflow.processTrainingStreakUpdateJob(job);
  });
}

export function runTrainingStreakWorkerOnce(
  input: RunTrainingStreakWorkerOnceInput,
) {
  return Effect.gen(function* () {
    const workflow = yield* TrainingStreakWorkflow;

    return yield* workflow.runTrainingStreakWorkerOnce(input);
  });
}
