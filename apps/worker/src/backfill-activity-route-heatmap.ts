import { enqueueActivityRouteHeatmapCalculation } from "@korex/api/modules/activities/route-heatmap/activity-route-heatmap-jobs.repository";
import { ActivityRouteHeatmapWorkflowLive } from "@korex/api/modules/activities/route-heatmap/activity-route-heatmap-workflow.live";
import { runActivityRouteHeatmapWorkerOnce } from "@korex/api/modules/activities/route-heatmap/activity-route-heatmap-workflow.service";
import {
  activities,
  activityMaps,
  activityRouteHeatmapCalculationJobs,
  activityRouteHeatmapCells,
  activityRouteHeatmapContributionSets,
  db,
} from "@korex/db";
import { and, eq } from "drizzle-orm";
import { Effect } from "effect";

if (!process.argv.includes("--reset")) {
  throw new Error(
    "Activity Route Heatmap backfill requires --reset because existing aggregate cells cannot be combined with an empty contribution-set projection",
  );
}

await db.transaction(async (tx) => {
  await tx.delete(activityRouteHeatmapCells);
  await tx.delete(activityRouteHeatmapContributionSets);
});

const qualifyingActivities = await db
  .select({ activityId: activities.id })
  .from(activities)
  .innerJoin(activityMaps, eq(activityMaps.activityId, activities.id))
  .where(eq(activities.sportType, "run"));

for (const { activityId } of qualifyingActivities) {
  await enqueueActivityRouteHeatmapCalculation({ activityId });
}

while (true) {
  const result = await Effect.runPromise(
    runActivityRouteHeatmapWorkerOnce({
      batchSize: 25,
      staleLockMs: 60_000,
      workerId: "activity-route-heatmap-backfill",
    }).pipe(Effect.provide(ActivityRouteHeatmapWorkflowLive)),
  );

  if (result.processed === 0) {
    break;
  }
}

const failedJobs = await db
  .select({ activityId: activityRouteHeatmapCalculationJobs.activityId })
  .from(activityRouteHeatmapCalculationJobs)
  .innerJoin(
    activities,
    eq(activities.id, activityRouteHeatmapCalculationJobs.activityId),
  )
  .innerJoin(activityMaps, eq(activityMaps.activityId, activities.id))
  .where(
    and(
      eq(activities.sportType, "run"),
      eq(activityRouteHeatmapCalculationJobs.status, "failed"),
    ),
  );

if (failedJobs.length > 0) {
  throw new Error(
    `Activity Route Heatmap backfill failed for ${failedJobs.length} Activities`,
  );
}

console.info(
  `Backfilled Activity Route Heatmap data for ${qualifyingActivities.length} Activities`,
);
