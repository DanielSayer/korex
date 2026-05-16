import { enqueueMissingActivityRouteHeatmapCalculations } from "@korex/api/modules/activities/activity-route-heatmap-jobs.repository";

const result = await enqueueMissingActivityRouteHeatmapCalculations();

console.info(`Enqueued ${result.enqueued} activity route heatmap jobs`);
