import { listTrainingGoals } from "@korex/api/modules/activities/training-goals/training-goal.repository";
import {
  archiveTrainingGoal,
  createTrainingGoal,
  listTrainingGoalProgress,
  updateTrainingGoal,
} from "@korex/api/modules/activities/training-goals/training-goal.service";
import {
  TrainingGoalAlreadyExistsError,
  TrainingGoalNotFoundError,
} from "@korex/api/modules/activities/training-goals/training-goal.types";
import { db, user } from "@korex/db";
import { describe, expect, it } from "vitest";
import { ActivityBuilder } from "../../setup/integration/test-data/activity-builder";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { TrainingGoalBuilder } from "../../setup/integration/test-data/training-goal-builder";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("training goal service", () => {
  it("creates a running goal for the current period and lists the goal definition", async () => {
    const goal = await createTrainingGoal({
      metric: "distance",
      now: new Date("2026-05-13T03:00:00.000Z"),
      period: "trainingWeek",
      targetValue: 40_000,
      userId: userDataExtensions.HughJass.id,
    });

    expect(goal).toMatchObject({
      archivedAt: null,
      effectiveFromPeriodStartAt: new Date("2026-05-10T14:00:00.000Z"),
      effectiveUntilPeriodStartAt: null,
      metric: "distance",
      period: "trainingWeek",
      sportScope: "running",
      targetValue: 40_000,
    });

    await expect(
      listTrainingGoals({ userId: userDataExtensions.HughJass.id }),
    ).resolves.toMatchObject([
      {
        effectiveFromPeriodStartAt: new Date("2026-05-10T14:00:00.000Z"),
        metric: "distance",
        period: "trainingWeek",
        sportScope: "running",
        targetValue: 40_000,
      },
    ]);
  });

  it("rejects duplicate active goals for the same metric, period, and sport scope", async () => {
    const userId = userDataExtensions.HughJass.id;

    await DataSeedAsync.withTrainingGoals(
      TrainingGoalBuilder.initWithUser(userId)
        .withId(1501)
        .withMetric("activityCount")
        .withPeriod("calendarMonth")
        .withTargetValue(12)
        .withEffectiveFromPeriodStartAt(new Date("2026-04-30T14:00:00.000Z"))
        .build(),
    ).seedAsync();

    await expect(
      createTrainingGoal({
        metric: "activityCount",
        now: new Date("2026-05-13T03:00:00.000Z"),
        period: "calendarMonth",
        targetValue: 16,
        userId,
      }),
    ).rejects.toBeInstanceOf(TrainingGoalAlreadyExistsError);
  });

  it("calculates live distance progress from current running-scope Activities", async () => {
    const userId = userDataExtensions.HughJass.id;
    const otherUser = {
      email: "training-goals-other@example.com",
      id: "training-goals-other-user-id",
      name: "Training Goals Other User",
    };

    await db.insert(user).values(otherUser);
    await DataSeedAsync.withTrainingGoals(
      TrainingGoalBuilder.initWithUser(userId)
        .withId(1511)
        .withMetric("distance")
        .withPeriod("trainingWeek")
        .withTargetValue(25_000)
        .withEffectiveFromPeriodStartAt(new Date("2026-05-10T14:00:00.000Z"))
        .build(),
    )
      .withActivities(
        ActivityBuilder.initWithUser(userId)
          .withId(1511)
          .withStartAt(new Date("2026-05-11T00:00:00.000Z"))
          .withDistanceMeters(10_000)
          .build(),
        ActivityBuilder.initWithUser(userId)
          .withId(1512)
          .withSportType("treadmill")
          .withStartAt(new Date("2026-05-12T00:00:00.000Z"))
          .withDistanceMeters(16_000)
          .build(),
        ActivityBuilder.initWithUser(userId)
          .withId(1513)
          .withSportType("hike")
          .withStartAt(new Date("2026-05-13T00:00:00.000Z"))
          .withDistanceMeters(9000)
          .build(),
        ActivityBuilder.initWithUser(userId)
          .withId(1514)
          .withStartAt(new Date("2026-05-20T00:00:00.000Z"))
          .withDistanceMeters(12_000)
          .build(),
        ActivityBuilder.initWithUser(otherUser.id)
          .withId(2511)
          .withStartAt(new Date("2026-05-12T00:00:00.000Z"))
          .withDistanceMeters(50_000)
          .build(),
      )
      .seedAsync();

    await expect(
      listTrainingGoalProgress({
        now: new Date("2026-05-13T03:00:00.000Z"),
        userId,
      }),
    ).resolves.toMatchObject([
      {
        achieved: true,
        currentValue: 26_000,
        metric: "distance",
        percentComplete: 100,
        periodEndAt: new Date("2026-05-17T14:00:00.000Z"),
        periodStartAt: new Date("2026-05-10T14:00:00.000Z"),
        targetValue: 25_000,
      },
    ]);
  });

  it("calculates live activity-count progress from current running-scope Activities", async () => {
    const userId = userDataExtensions.HughJass.id;

    await DataSeedAsync.withTrainingGoals(
      TrainingGoalBuilder.initWithUser(userId)
        .withId(1521)
        .withMetric("activityCount")
        .withPeriod("calendarMonth")
        .withTargetValue(4)
        .withEffectiveFromPeriodStartAt(new Date("2026-04-30T14:00:00.000Z"))
        .build(),
    )
      .withActivities(
        ActivityBuilder.initWithUser(userId)
          .withId(1521)
          .withStartAt(new Date("2026-05-01T00:00:00.000Z"))
          .build(),
        ActivityBuilder.initWithUser(userId)
          .withId(1522)
          .withSportType("treadmill")
          .withStartAt(new Date("2026-05-02T00:00:00.000Z"))
          .build(),
        ActivityBuilder.initWithUser(userId)
          .withId(1523)
          .withSportType("hike")
          .withStartAt(new Date("2026-05-03T00:00:00.000Z"))
          .build(),
      )
      .seedAsync();

    await expect(
      listTrainingGoalProgress({
        now: new Date("2026-05-13T03:00:00.000Z"),
        userId,
      }),
    ).resolves.toMatchObject([
      {
        achieved: false,
        currentValue: 2,
        metric: "activityCount",
        percentComplete: 50,
        targetValue: 4,
      },
    ]);
  });

  it("updates the target from the next matching period", async () => {
    const userId = userDataExtensions.HughJass.id;

    await DataSeedAsync.withTrainingGoals(
      TrainingGoalBuilder.initWithUser(userId)
        .withId(1531)
        .withMetric("distance")
        .withPeriod("trainingWeek")
        .withTargetValue(40_000)
        .withEffectiveFromPeriodStartAt(new Date("2026-05-10T14:00:00.000Z"))
        .build(),
    ).seedAsync();

    await expect(
      updateTrainingGoal({
        id: 1531,
        now: new Date("2026-05-13T03:00:00.000Z"),
        targetValue: 55_000,
        userId,
      }),
    ).resolves.toMatchObject({
      effectiveFromPeriodStartAt: new Date("2026-05-17T14:00:00.000Z"),
      targetValue: 55_000,
    });

    await expect(
      listTrainingGoalProgress({
        now: new Date("2026-05-13T03:00:00.000Z"),
        userId,
      }),
    ).resolves.toMatchObject([{ targetValue: 40_000 }]);
    await expect(
      listTrainingGoalProgress({
        now: new Date("2026-05-18T03:00:00.000Z"),
        userId,
      }),
    ).resolves.toMatchObject([{ targetValue: 55_000 }]);
  });

  it("replaces a pending future target when updated again before it applies", async () => {
    const userId = userDataExtensions.HughJass.id;

    await DataSeedAsync.withTrainingGoals(
      TrainingGoalBuilder.initWithUser(userId)
        .withId(1541)
        .withMetric("distance")
        .withPeriod("trainingWeek")
        .withTargetValue(40_000)
        .withEffectiveFromPeriodStartAt(new Date("2026-05-10T14:00:00.000Z"))
        .build(),
    ).seedAsync();

    await updateTrainingGoal({
      id: 1541,
      now: new Date("2026-05-13T03:00:00.000Z"),
      targetValue: 50_000,
      userId,
    });
    await updateTrainingGoal({
      id: 1541,
      now: new Date("2026-05-15T03:00:00.000Z"),
      targetValue: 55_000,
      userId,
    });

    const goals = await listTrainingGoals({ userId });

    expect(goals).toHaveLength(1);
    expect(goals[0]).toMatchObject({
      effectiveFromPeriodStartAt: new Date("2026-05-17T14:00:00.000Z"),
      targetValue: 55_000,
    });
  });

  it("archives the goal immediately and rejects later updates", async () => {
    const userId = userDataExtensions.HughJass.id;

    await DataSeedAsync.withTrainingGoals(
      TrainingGoalBuilder.initWithUser(userId)
        .withId(1551)
        .withMetric("activityCount")
        .withPeriod("calendarMonth")
        .withTargetValue(4)
        .withEffectiveFromPeriodStartAt(new Date("2026-04-30T14:00:00.000Z"))
        .build(),
    ).seedAsync();

    await expect(
      archiveTrainingGoal({
        id: 1551,
        now: new Date("2026-05-13T03:00:00.000Z"),
        userId,
      }),
    ).resolves.toEqual({ archived: true });
    await expect(
      listTrainingGoalProgress({
        now: new Date("2026-05-13T03:00:00.000Z"),
        userId,
      }),
    ).resolves.toEqual([]);
    await expect(
      updateTrainingGoal({
        id: 1551,
        now: new Date("2026-05-13T03:00:00.000Z"),
        targetValue: 5,
        userId,
      }),
    ).rejects.toBeInstanceOf(TrainingGoalNotFoundError);
  });
});
