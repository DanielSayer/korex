import { getCompletedTrainingWeek } from "@korex/api/modules/activities/weekly-training-summaries/training-week";
import { weeklyTrainingSummaryScheduleJobName } from "@korex/api/modules/activities/weekly-training-summaries/weekly-training-summary-schedule-job";
import { enqueueRecurringJob } from "@korex/api/modules/job-runtime/job-runtime";

const brisbaneUtcOffsetHours = 10;
const enqueueHour = 6;
const millisecondsPerHour = 60 * 60 * 1000;

export async function runWeeklyTrainingSummarySchedulerOnce({
  enqueueOccurrence = enqueueRecurringJob,
  now = new Date(),
}: {
  enqueueOccurrence?: typeof enqueueRecurringJob;
  now?: Date;
} = {}): Promise<
  { scheduled: false } | { jobId: string; scheduled: true; weekStartAt: Date }
> {
  const brisbaneNow = new Date(
    now.getTime() + brisbaneUtcOffsetHours * millisecondsPerHour,
  );

  if (
    brisbaneNow.getUTCDay() !== 1 ||
    brisbaneNow.getUTCHours() < enqueueHour
  ) {
    return { scheduled: false };
  }

  const { weekStartAt } = getCompletedTrainingWeek(now);
  const job = await enqueueOccurrence({
    name: weeklyTrainingSummaryScheduleJobName,
    payload: { weekStartAt: weekStartAt.toISOString() },
    scheduleKey: weekStartAt.toISOString(),
  });

  return {
    jobId: job.id,
    scheduled: true,
    weekStartAt,
  };
}
