import { replaceActivityStreams } from "@korex/api/modules/activities/artifacts/activity-artifacts.repository";
import { enqueueActivityBestEffortCalculation } from "@korex/api/modules/activities/best-efforts/activity-best-effort-jobs.repository";
import { ActivityBestEffortWorkflowLive } from "@korex/api/modules/activities/best-efforts/activity-best-effort-workflow.live";
import { runActivityBestEffortWorkerOnce } from "@korex/api/modules/activities/best-efforts/activity-best-effort-workflow.service";
import {
  activities,
  activityBestEffortCalculationJobs,
  activityBestEfforts,
  db,
  personalBestEfforts,
} from "@korex/db";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { ActivityBuilder } from "../../setup/integration/test-data/activity-builder";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("activity best effort workflow", () => {
  it("replaces activity best efforts and refreshes personal bests when the best changes or disappears", async () => {
    const slowerActivity = ActivityBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    )
      .withId(1001)
      .withStartAt(new Date("2026-04-01T00:00:00.000Z"))
      .build();
    const fasterActivity = ActivityBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    )
      .withId(1002)
      .withStartAt(new Date("2026-04-02T00:00:00.000Z"))
      .build();
    await DataSeedAsync.withActivities(
      slowerActivity,
      fasterActivity,
    ).seedAsync();
    await replaceActivityStreams({
      activityId: slowerActivity.id,
      streams: [
        { data: [0, 400, 800], streamType: "distance" },
        { data: [0, 80, 160], streamType: "elapsedTime" },
      ],
    });
    await replaceActivityStreams({
      activityId: fasterActivity.id,
      streams: [
        { data: [0, 400, 800], streamType: "distance" },
        { data: [0, 60, 120], streamType: "elapsedTime" },
      ],
    });
    await enqueueActivityBestEffortCalculation({
      activityId: slowerActivity.id,
    });
    await enqueueActivityBestEffortCalculation({
      activityId: fasterActivity.id,
    });

    const firstResult = await runWorkflow();

    const [personalBest] = await db
      .select()
      .from(personalBestEfforts)
      .where(eq(personalBestEfforts.standardDistanceCode, "400m"));
    const efforts = await db.select().from(activityBestEfforts);
    expect(firstResult).toEqual({ processed: 2 });
    expect(efforts.length).toBeGreaterThan(0);
    expect(personalBest).toMatchObject({
      activityId: fasterActivity.id,
      durationSeconds: 60,
      standardDistanceCode: "400m",
    });

    await db
      .update(activities)
      .set({ sportType: "hike" })
      .where(eq(activities.id, fasterActivity.id));
    await enqueueActivityBestEffortCalculation({
      activityId: fasterActivity.id,
    });

    const secondResult = await runWorkflow();

    const [refreshedPersonalBest] = await db
      .select()
      .from(personalBestEfforts)
      .where(eq(personalBestEfforts.standardDistanceCode, "400m"));
    expect(secondResult).toEqual({ processed: 1 });
    expect(refreshedPersonalBest).toMatchObject({
      activityId: slowerActivity.id,
      durationSeconds: 80,
      standardDistanceCode: "400m",
    });

    await db
      .update(activities)
      .set({ sportType: "hike" })
      .where(eq(activities.id, slowerActivity.id));
    await enqueueActivityBestEffortCalculation({
      activityId: slowerActivity.id,
    });

    const thirdResult = await runWorkflow();

    const finalPersonalBests = await db.select().from(personalBestEfforts);
    const [job] = await db
      .select()
      .from(activityBestEffortCalculationJobs)
      .where(
        eq(activityBestEffortCalculationJobs.activityId, slowerActivity.id),
      );
    expect(thirdResult).toEqual({ processed: 1 });
    expect(finalPersonalBests).toEqual([]);
    expect(job).toMatchObject({
      status: "succeeded",
    });
  });
});

function runWorkflow() {
  return Effect.runPromise(
    runActivityBestEffortWorkerOnce({
      batchSize: 10,
      now: new Date("2026-04-01T00:00:00.000Z"),
      staleLockMs: 60_000,
      workerId: "worker-1",
    }).pipe(Effect.provide(ActivityBestEffortWorkflowLive)),
  );
}
