import { ActivityArtifactWorkflowLive } from "@korex/api/modules/activities/artifacts/activity-artifact-workflow.live";
import { replaceActivityMapAndQueueHeatmapCalculation } from "@korex/api/modules/activities/artifacts/activity-artifact-workflow.service";
import {
  activityMaps,
  activityRouteHeatmapCalculationJobs,
  db,
} from "@korex/db";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { ActivityBuilder } from "../../setup/integration/test-data/activity-builder";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("activity artifact workflow", () => {
  it("replaces an activity map and queues route heatmap calculation", async () => {
    const activity = ActivityBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    ).build();
    await DataSeedAsync.withActivities(activity).seedAsync();

    await Effect.runPromise(
      replaceActivityMapAndQueueHeatmapCalculation({
        activityId: activity.id,
        map: {
          bounds: null,
          coordinates: [
            { latitude: -27.581491, longitude: 153.06828 },
            { latitude: -27.581144, longitude: 153.06902 },
          ],
        },
      }).pipe(Effect.provide(ActivityArtifactWorkflowLive)),
    );

    const [map] = await db
      .select()
      .from(activityMaps)
      .where(eq(activityMaps.activityId, activity.id));
    const [job] = await db
      .select()
      .from(activityRouteHeatmapCalculationJobs)
      .where(eq(activityRouteHeatmapCalculationJobs.activityId, activity.id));

    expect(map).toMatchObject({
      activityId: activity.id,
      coordinates: [
        { latitude: -27.581491, longitude: 153.06828 },
        { latitude: -27.581144, longitude: 153.06902 },
      ],
    });
    expect(job).toMatchObject({
      activityId: activity.id,
      attemptCount: 0,
      status: "pending",
    });
  });
});
