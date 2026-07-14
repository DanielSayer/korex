import { replaceActivityStreams } from "@korex/api/modules/activities/artifacts/activity-artifacts.repository";
import { activityBestEffortJobModule } from "@korex/api/modules/activities/best-efforts/activity-best-effort-job";
import { activityBestEfforts, db } from "@korex/db";
import { eq } from "drizzle-orm";
import { ActivityBuilder } from "../../setup/integration/test-data/activity-builder";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("activity best effort job", () => {
  it("processes an activity through a plain async handler", async () => {
    const activity = ActivityBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    )
      .withId(1001)
      .build();
    await DataSeedAsync.withActivities(activity).seedAsync();
    await replaceActivityStreams({
      activityId: activity.id,
      streams: [
        { data: [0, 400, 800], streamType: "distance" },
        { data: [0, 60, 120], streamType: "elapsedTime" },
      ],
    });

    await activityBestEffortJobModule.handler(
      { activityId: activity.id },
      {
        database: db,
        jobId: "best-effort-job",
        signal: new AbortController().signal,
      },
    );

    const [effort] = await db
      .select()
      .from(activityBestEfforts)
      .where(eq(activityBestEfforts.standardDistanceCode, "400m"));
    expect(effort).toMatchObject({
      activityId: activity.id,
      durationSeconds: 60,
    });
  });
});
