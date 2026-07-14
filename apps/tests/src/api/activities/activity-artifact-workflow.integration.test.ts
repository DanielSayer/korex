import { activityArtifactModule } from "@korex/api/modules/activities/artifacts/activity-artifact.module";
import { replaceActivityMap } from "@korex/api/modules/activities/artifacts/activity-artifacts.repository";
import { activityRouteHeatmapJobModule } from "@korex/api/modules/activities/route-heatmap/activity-route-heatmap-job";
import { activityMaps, db, jobRuntimeJobs } from "@korex/db";
import { and, eq, sql } from "drizzle-orm";
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

    await activityArtifactModule.replaceActivityMapAndQueueHeatmapCalculation({
      activityId: activity.id,
      map: {
        bounds: null,
        coordinates: [
          { latitude: -27.581491, longitude: 153.06828 },
          { latitude: -27.581144, longitude: 153.06902 },
        ],
      },
    });

    const [map] = await db
      .select()
      .from(activityMaps)
      .where(eq(activityMaps.activityId, activity.id));
    const [job] = await db
      .select()
      .from(jobRuntimeJobs)
      .where(
        and(
          eq(jobRuntimeJobs.name, activityRouteHeatmapJobModule.name),
          eq(jobRuntimeJobs.key, String(activity.id)),
        ),
      );

    expect(map).toMatchObject({
      activityId: activity.id,
      coordinates: [
        { latitude: -27.581491, longitude: 153.06828 },
        { latitude: -27.581144, longitude: 153.06902 },
      ],
    });
    expect(job).toMatchObject({
      attemptCount: 0,
      payload: { activityId: activity.id },
      state: "queued",
    });
  });

  it("rolls back the map replacement when heatmap enqueue fails", async () => {
    const activity = ActivityBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    ).build();
    await DataSeedAsync.withActivities(activity).seedAsync();
    await replaceActivityMap({
      activityId: activity.id,
      map: {
        bounds: null,
        coordinates: [{ latitude: -27.581491, longitude: 153.06828 }],
      },
    });

    await db.execute(sql`
      CREATE FUNCTION fail_activity_heatmap_job_insert()
      RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'forced activity heatmap job insert failure';
      END;
      $$ LANGUAGE plpgsql
    `);
    await db.execute(sql`
      CREATE TRIGGER fail_activity_heatmap_job_insert
      BEFORE INSERT ON job_runtime_jobs
      FOR EACH ROW EXECUTE FUNCTION fail_activity_heatmap_job_insert()
    `);

    try {
      await expect(
        activityArtifactModule.replaceActivityMapAndQueueHeatmapCalculation({
          activityId: activity.id,
          map: {
            bounds: null,
            coordinates: [{ latitude: -27.581144, longitude: 153.06902 }],
          },
        }),
      ).rejects.toThrow();
    } finally {
      await db.execute(sql`
        DROP TRIGGER fail_activity_heatmap_job_insert
        ON job_runtime_jobs
      `);
      await db.execute(sql`DROP FUNCTION fail_activity_heatmap_job_insert()`);
    }

    const [map] = await db
      .select()
      .from(activityMaps)
      .where(eq(activityMaps.activityId, activity.id));
    const jobs = await db
      .select()
      .from(jobRuntimeJobs)
      .where(
        and(
          eq(jobRuntimeJobs.name, activityRouteHeatmapJobModule.name),
          eq(jobRuntimeJobs.key, String(activity.id)),
        ),
      );

    expect(map?.coordinates).toEqual([
      { latitude: -27.581491, longitude: 153.06828 },
    ]);
    expect(jobs).toEqual([]);
  });
});
