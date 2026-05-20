import { Effect } from "effect";
import type { WeeklyTrainingSummaryGenerationJob } from "./weekly-training-summary-jobs.repository";
import { WeeklyTrainingSummaryWorkflowLive } from "./weekly-training-summary-workflow.live";
import { processWeeklyTrainingSummaryGenerationJob as processWeeklyTrainingSummaryGenerationJobWorkflow } from "./weekly-training-summary-workflow.service";

export async function processWeeklyTrainingSummaryGenerationJob(
  job: WeeklyTrainingSummaryGenerationJob,
) {
  await Effect.runPromise(
    processWeeklyTrainingSummaryGenerationJobWorkflow(job).pipe(
      Effect.provide(WeeklyTrainingSummaryWorkflowLive),
    ),
  );
}
