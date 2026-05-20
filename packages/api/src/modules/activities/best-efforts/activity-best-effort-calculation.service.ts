import { Effect } from "effect";
import type { ActivityBestEffortCalculationJob } from "./activity-best-effort-jobs.repository";
import { ActivityBestEffortWorkflowLive } from "./activity-best-effort-workflow.live";
import { processActivityBestEffortCalculationJob as processActivityBestEffortCalculationJobWorkflow } from "./activity-best-effort-workflow.service";

export async function processActivityBestEffortCalculationJob(
  job: ActivityBestEffortCalculationJob,
) {
  await Effect.runPromise(
    processActivityBestEffortCalculationJobWorkflow(job).pipe(
      Effect.provide(ActivityBestEffortWorkflowLive),
    ),
  );
}
