import { activityRouteHeatmapJobModule } from "@korex/api/modules/activities/route-heatmap/activity-route-heatmap-job";
import { enqueueActivityRouteHeatmapCalculation } from "@korex/api/modules/activities/route-heatmap/activity-route-heatmap-jobs.repository";
import {
  createJobRuntime,
  inspectJob,
} from "@korex/api/modules/job-runtime/job-runtime";
import {
  activities,
  activityRouteHeatmapCells,
  activityRouteHeatmapContributionSets,
  db,
} from "@korex/db";
import { eq } from "drizzle-orm";
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
    const firstJob = await enqueueActivityRouteHeatmapCalculation({
      activityId: firstActivity.id,
    });
    const secondJob = await enqueueActivityRouteHeatmapCalculation({
      activityId: secondActivity.id,
    });

    await runWorkflow([firstJob.id, secondJob.id]);

    const firstContributionSets = await db
      .select()
      .from(activityRouteHeatmapContributionSets);
    const firstCells = await db.select().from(activityRouteHeatmapCells);
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
    const clearingSecondJob = await enqueueActivityRouteHeatmapCalculation({
      activityId: secondActivity.id,
    });

    await runWorkflow([clearingSecondJob.id]);

    const secondActivityContributionSets = await db
      .select()
      .from(activityRouteHeatmapContributionSets)
      .where(
        eq(activityRouteHeatmapContributionSets.activityId, secondActivity.id),
      );
    const secondCells = await db.select().from(activityRouteHeatmapCells);
    expect(secondActivityContributionSets).toEqual([]);
    expect(secondCells.length).toBeGreaterThan(0);
    expect(secondCells.every((cell) => cell.activityCount === 1)).toBe(true);

    await db
      .update(activities)
      .set({ sportType: "hike" })
      .where(eq(activities.id, firstActivity.id));
    const clearingFirstJob = await enqueueActivityRouteHeatmapCalculation({
      activityId: firstActivity.id,
    });

    await runWorkflow([clearingFirstJob.id]);

    const finalContributionSets = await db
      .select()
      .from(activityRouteHeatmapContributionSets);
    const finalCells = await db.select().from(activityRouteHeatmapCells);
    expect(finalContributionSets).toEqual([]);
    expect(finalCells).toEqual([]);
  });
});

async function runWorkflow(jobIds: string[]) {
  const runtime = createJobRuntime({
    databaseUrl: requiredDatabaseUrl(),
    pollIntervalMs: 5,
    tasks: {
      [activityRouteHeatmapJobModule.name]:
        activityRouteHeatmapJobModule.handler,
    },
    workerId: "route-heatmap-integration",
  });

  try {
    await runtime.start();
    await expect
      .poll(async () => {
        const jobs = await Promise.all(jobIds.map((id) => inspectJob({ id })));
        return jobs.map((job) => `${job?.state}:${job?.lastError}`);
      })
      .toEqual(jobIds.map(() => "succeeded:null"));
  } finally {
    await runtime.stop();
  }
}

function requiredDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for integration tests");
  }

  return databaseUrl;
}
