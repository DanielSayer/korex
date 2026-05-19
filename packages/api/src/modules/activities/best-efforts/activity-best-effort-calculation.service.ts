import {
  getActivityBestEffortCalculationInputs,
  replaceActivityBestEffortsAndRefreshPersonalBests,
} from "./activity-best-effort.repository";
import {
  type ActivityBestEffortCalculationJob,
  markActivityBestEffortCalculationFailed,
  markActivityBestEffortCalculationSucceeded,
} from "./activity-best-effort-jobs.repository";
import { calculateActivityBestEfforts } from "./activity-best-efforts";

export async function processActivityBestEffortCalculationJob(
  job: ActivityBestEffortCalculationJob,
) {
  try {
    const inputs = await getActivityBestEffortCalculationInputs({
      activityId: job.activityId,
    });

    const efforts =
      inputs.activity?.sportType === "run" ||
      inputs.activity?.sportType === "treadmill"
        ? calculateActivityBestEfforts({
            distanceSamples: inputs.distanceSamples,
            elapsedTimeSamples: inputs.elapsedTimeSamples,
          })
        : [];

    await replaceActivityBestEffortsAndRefreshPersonalBests({
      activityId: job.activityId,
      efforts,
    });
    await markActivityBestEffortCalculationSucceeded({ jobId: job.id });
  } catch (error) {
    await markActivityBestEffortCalculationFailed({
      error: error instanceof Error ? error.message : "Unknown error",
      jobId: job.id,
    });
  }
}
