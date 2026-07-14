import type { JobHandler } from "../../job-runtime/job-runtime";
import { enqueueWeeklyTrainingSummariesForWeek } from "./weekly-training-summary-scheduler.service";

export const weeklyTrainingSummaryScheduleJobName =
  "weekly-training-summary.schedule";

type WeeklyTrainingSummaryScheduleJobDependencies = {
  enqueueForWeek: typeof enqueueWeeklyTrainingSummariesForWeek;
};

export function createWeeklyTrainingSummaryScheduleJobModule(
  dependencies: WeeklyTrainingSummaryScheduleJobDependencies,
) {
  return {
    handler: async (
      payload: Record<string, unknown>,
      context: Parameters<JobHandler>[1],
    ) => {
      context.signal.throwIfAborted();
      await dependencies.enqueueForWeek({
        database: context.database,
        skipSucceeded: true,
        weekStartAt: requiredWeekStartAt(payload),
      });
    },
    name: weeklyTrainingSummaryScheduleJobName,
  };
}

export const weeklyTrainingSummaryScheduleJobModule =
  createWeeklyTrainingSummaryScheduleJobModule({
    enqueueForWeek: enqueueWeeklyTrainingSummariesForWeek,
  });

function requiredWeekStartAt(payload: Record<string, unknown>) {
  const weekStartAt = new Date(String(payload.weekStartAt));

  if (Number.isNaN(weekStartAt.getTime())) {
    throw new Error(
      "Weekly Training Summary schedule job requires a valid weekStartAt",
    );
  }

  return weekStartAt;
}
