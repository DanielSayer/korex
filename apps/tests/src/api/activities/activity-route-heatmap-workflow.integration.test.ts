import { enqueueActivityRouteHeatmapCalculation } from "@korex/api/modules/activities/route-heatmap/activity-route-heatmap-jobs.repository";
import { ActivityRouteHeatmapWorkflowLive } from "@korex/api/modules/activities/route-heatmap/activity-route-heatmap-workflow.live";
import { runActivityRouteHeatmapWorkerOnce } from "@korex/api/modules/activities/route-heatmap/activity-route-heatmap-workflow.service";
import {
  activities,
  activityRouteHeatmapCells,
  activityRouteHeatmapContributionSets,
  db,
} from "@korex/db";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { ActivityBuilder } from "../../setup/integration/test-data/activity-builder";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("activity route heatmap workflow", () => {
  it("replaces contributions, increments aggregate cells, and clears stale aggregates", async () => {
    const map = {
      bounds: null,
      coordinates: [
        { latitude: -27.581491, longitude: 153.06828 },
        { latitude: -27.581144, longitude: 153.06902 },
      ],
    };
    const firstActivity = ActivityBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    )
      .withId(1001)
      .withMap(map)
      .build();
    const secondActivity = ActivityBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    )
      .withId(1002)
      .withMap(map)
      .build();
    await DataSeedAsync.withActivities(
      firstActivity,
      secondActivity,
    ).seedAsync();
    await enqueueActivityRouteHeatmapCalculation({
      activityId: firstActivity.id,
    });
    await enqueueActivityRouteHeatmapCalculation({
      activityId: secondActivity.id,
    });

    const firstResult = await runWorkflow();

    const firstContributionSets = await db
      .select()
      .from(activityRouteHeatmapContributionSets);
    const firstCells = await db.select().from(activityRouteHeatmapCells);
    expect(firstResult).toEqual({ processed: 2 });
    expect(firstContributionSets).toHaveLength(24);
    expect(
      firstContributionSets.every(
        (contributionSet) => contributionSet.cellKeys.length > 0,
      ),
    ).toBe(true);
    expect(firstCells.length).toBeGreaterThan(0);
    expect(firstCells.every((cell) => cell.activityCount === 2)).toBe(true);

    await db
      .update(activities)
      .set({ sportType: "hike" })
      .where(eq(activities.id, secondActivity.id));
    await enqueueActivityRouteHeatmapCalculation({
      activityId: secondActivity.id,
    });

    const secondResult = await runWorkflow();

    const secondActivityContributionSets = await db
      .select()
      .from(activityRouteHeatmapContributionSets)
      .where(
        eq(activityRouteHeatmapContributionSets.activityId, secondActivity.id),
      );
    const secondCells = await db.select().from(activityRouteHeatmapCells);
    expect(secondResult).toEqual({ processed: 1 });
    expect(secondActivityContributionSets).toEqual([]);
    expect(secondCells.length).toBeGreaterThan(0);
    expect(secondCells.every((cell) => cell.activityCount === 1)).toBe(true);

    await db
      .update(activities)
      .set({ sportType: "hike" })
      .where(eq(activities.id, firstActivity.id));
    await enqueueActivityRouteHeatmapCalculation({
      activityId: firstActivity.id,
    });

    const thirdResult = await runWorkflow();

    const finalContributionSets = await db
      .select()
      .from(activityRouteHeatmapContributionSets);
    const finalCells = await db.select().from(activityRouteHeatmapCells);
    expect(thirdResult).toEqual({ processed: 1 });
    expect(finalContributionSets).toEqual([]);
    expect(finalCells).toEqual([]);
  });
});

function runWorkflow() {
  return Effect.runPromise(
    runActivityRouteHeatmapWorkerOnce({
      batchSize: 10,
      now: new Date("2026-04-01T00:00:00.000Z"),
      staleLockMs: 60_000,
      workerId: "worker-1",
    }).pipe(Effect.provide(ActivityRouteHeatmapWorkflowLive)),
  );
}
