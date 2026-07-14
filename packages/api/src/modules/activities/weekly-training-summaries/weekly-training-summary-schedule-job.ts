import { weeklyTrainingSummaryScheduleJobDefinition } from "../activity-job-definitions";
import { enqueueWeeklyTrainingSummariesForWeek } from "./weekly-training-summary-scheduler.service";

export const weeklyTrainingSummaryScheduleJobModule =
  weeklyTrainingSummaryScheduleJobDefinition.implement(
    async ({ weekStartAt }, context) => {
      await enqueueWeeklyTrainingSummariesForWeek({
        database: context.database,
        skipSucceeded: true,
        weekStartAt,
      });
    },
  );
