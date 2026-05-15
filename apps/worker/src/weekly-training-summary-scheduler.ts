import { enqueueCompletedWeeklyTrainingSummaries } from "@korex/api/modules/activities/weekly-training-summary-jobs.repository";

const brisbaneUtcOffsetHours = 10;
const enqueueHour = 6;
const millisecondsPerHour = 60 * 60 * 1000;

export async function runWeeklyTrainingSummarySchedulerOnce({
  now = new Date(),
}: {
  now?: Date;
} = {}): Promise<
  | { enqueued: 0; skipped: true }
  | { enqueued: number; skipped: false; weekStartAt: Date }
> {
  const brisbaneNow = new Date(
    now.getTime() + brisbaneUtcOffsetHours * millisecondsPerHour,
  );

  if (
    brisbaneNow.getUTCDay() !== 1 ||
    brisbaneNow.getUTCHours() < enqueueHour
  ) {
    return { enqueued: 0, skipped: true };
  }

  const result = await enqueueCompletedWeeklyTrainingSummaries({ now });

  return {
    enqueued: result.enqueued,
    skipped: false,
    weekStartAt: result.weekStartAt,
  };
}
