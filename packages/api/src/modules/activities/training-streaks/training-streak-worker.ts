import { Effect } from "effect";
import type { RunTrainingStreakWorkerOnceInput } from "./training-streak-workflow.dependencies";
import { TrainingStreakWorkflowLive } from "./training-streak-workflow.live";
import { runTrainingStreakWorkerOnce as runTrainingStreakWorkerOnceWorkflow } from "./training-streak-workflow.service";

export function runTrainingStreakWorkerOnce(
  input: RunTrainingStreakWorkerOnceInput,
) {
  return Effect.runPromise(
    runTrainingStreakWorkerOnceWorkflow(input).pipe(
      Effect.provide(TrainingStreakWorkflowLive),
    ),
  );
}
