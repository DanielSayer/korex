import { Effect } from "effect";
import { WeeklyTrainingSummaryWorkflowLive } from "./weekly-training-summary-workflow.live";
import { enqueueCompletedWeeklyTrainingSummaries as enqueueCompletedWeeklyTrainingSummariesWorkflow } from "./weekly-training-summary-workflow.service";

export async function enqueueCompletedWeeklyTrainingSummaries({
  now = new Date(),
  skipSucceeded = false,
}: {
  now?: Date;
  skipSucceeded?: boolean;
} = {}) {
  return Effect.runPromise(
    enqueueCompletedWeeklyTrainingSummariesWorkflow({
      now,
      skipSucceeded,
    }).pipe(Effect.provide(WeeklyTrainingSummaryWorkflowLive)),
  );
}
