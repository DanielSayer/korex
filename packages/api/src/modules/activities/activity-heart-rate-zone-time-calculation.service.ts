import {
  getActivityHeartRateZoneCalculationInputs,
  replaceActivityHeartRateZoneTimes,
} from "./activities.repository";
import {
  type ActivityHeartRateZoneTimeCalculationJob,
  markActivityHeartRateZoneTimeCalculationFailed,
  markActivityHeartRateZoneTimeCalculationSucceeded,
} from "./activity-heart-rate-zone-time-jobs.repository";
import { calculateActivityHeartRateZoneTimes } from "./activity-heart-rate-zone-times";

export async function processActivityHeartRateZoneTimeCalculationJob(
  job: ActivityHeartRateZoneTimeCalculationJob,
) {
  try {
    const inputs = await getActivityHeartRateZoneCalculationInputs({
      activityId: job.activityId,
    });

    if (inputs.movingTimeSeconds === null) {
      throw new Error("Activity moving time is required");
    }

    if (inputs.heartRateSamples.length === 0) {
      throw new Error("Activity heart-rate stream is required");
    }

    if (inputs.snapshots.length === 0) {
      throw new Error("Activity heart-rate zone snapshots are required");
    }

    const times = calculateActivityHeartRateZoneTimes(inputs);

    await replaceActivityHeartRateZoneTimes({
      activityId: job.activityId,
      times,
    });
    await markActivityHeartRateZoneTimeCalculationSucceeded({
      jobId: job.id,
    });
  } catch (error) {
    await markActivityHeartRateZoneTimeCalculationFailed({
      error: error instanceof Error ? error.message : "Unknown error",
      jobId: job.id,
    });
  }
}
