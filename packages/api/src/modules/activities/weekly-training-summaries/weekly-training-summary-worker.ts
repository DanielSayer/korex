import { Effect } from "effect";
import type { RunWeeklyTrainingSummaryWorkerOnceInput } from "./weekly-training-summary-workflow.dependencies";
import { WeeklyTrainingSummaryWorkflowLive } from "./weekly-training-summary-workflow.live";
import { runWeeklyTrainingSummaryWorkerOnce as runWeeklyTrainingSummaryWorkerOnceWorkflow } from "./weekly-training-summary-workflow.service";

export function runWeeklyTrainingSummaryWorkerOnce(
  input: RunWeeklyTrainingSummaryWorkerOnceInput,
) {
  return Effect.runPromise(
    runWeeklyTrainingSummaryWorkerOnceWorkflow(input).pipe(
      Effect.provide(WeeklyTrainingSummaryWorkflowLive),
    ),
  );
}
