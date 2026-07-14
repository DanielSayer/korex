import {
  activities,
  activityMaps,
  activityRouteHeatmapContributionSets,
  db,
} from "@korex/db";
import { and, eq, isNull } from "drizzle-orm";
import { enqueueJob } from "../../job-runtime/job-runtime";
import { activityRouteHeatmapJobDefinition } from "../activity-job-definitions";

type ActivityRouteHeatmapJobDatabase = Pick<typeof db, "insert" | "select">;

export async function enqueueActivityRouteHeatmapCalculation({
  activityId,
  database = db,
}: {
  activityId: number;
  database?: ActivityRouteHeatmapJobDatabase;
}) {
  return enqueueJob({
    database,
    key: String(activityId),
    name: activityRouteHeatmapJobDefinition.name,
    payload: { activityId },
  });
}

export async function enqueueMissingActivityRouteHeatmapCalculations({
  batchSize = 100,
}: {
  batchSize?: number;
} = {}) {
  const rows = await db
    .select({
      activityId: activities.id,
    })
    .from(activities)
    .innerJoin(activityMaps, eq(activityMaps.activityId, activities.id))
    .leftJoin(
      activityRouteHeatmapContributionSets,
      eq(activityRouteHeatmapContributionSets.activityId, activities.id),
    )
    .where(
      and(
        eq(activities.sportType, "run"),
        isNull(activityRouteHeatmapContributionSets.activityId),
      ),
    )
    .limit(batchSize);

  for (const row of rows) {
    await enqueueActivityRouteHeatmapCalculation({
      activityId: row.activityId,
    });
  }

  return {
    enqueued: rows.length,
  };
}
