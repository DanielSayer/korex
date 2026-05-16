import { enqueueCompletedWeeklyTrainingSummaries } from "@korex/api/modules/activities/weekly-training-summaries/weekly-training-summary-jobs.repository";

const result = await enqueueCompletedWeeklyTrainingSummaries();

console.info(
  `Enqueued ${result.enqueued} weekly training summary jobs for ${result.weekStartAt.toISOString()}`,
);
