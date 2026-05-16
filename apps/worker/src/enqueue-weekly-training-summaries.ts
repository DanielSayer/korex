import { enqueueCompletedWeeklyTrainingSummaries } from "@korex/api/modules/activities/activities.workers";

const result = await enqueueCompletedWeeklyTrainingSummaries();

console.info(
  `Enqueued ${result.enqueued} weekly training summary jobs for ${result.weekStartAt.toISOString()}`,
);
