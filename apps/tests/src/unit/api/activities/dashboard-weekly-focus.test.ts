import type { DashboardWeeklyDistance } from "@korex/api/modules/activities/activities.types";
import { buildDashboardWeeklyFocus } from "@korex/api/modules/activities/dashboard/dashboard-weekly-focus";
import type { TrainingGoalProgress } from "@korex/api/modules/activities/training-goals/training-goal.types";
import type { Equipment } from "@korex/api/modules/equipment/equipment.types";
import { describe, expect, it } from "vitest";

describe("dashboard weekly focus", () => {
  it("recommends starting simple when there are no current Training Week activities", () => {
    const focus = buildDashboardWeeklyFocus({
      activityCount: 0,
      distanceMeters: 0,
      equipment: [],
      goals: [weeklyDistanceGoal({ currentValue: 0, percentComplete: 0 })],
      now: new Date("2026-06-15T08:00:00.000Z"),
      weeklyDistance: weeklyDistance(),
    });

    expect(focus).toMatchObject({
      action: "One easy run",
      status: "restart",
      title: "Start simple.",
      tone: "warn",
    });
    expect(focus.reasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "activity", label: "No runs logged" }),
        expect.objectContaining({ kind: "goal", label: "0% of goal" }),
      ]),
    );
  });

  it("protects the week when a weekly goal is complete", () => {
    const focus = buildDashboardWeeklyFocus({
      activityCount: 4,
      distanceMeters: 42_000,
      equipment: [],
      goals: [
        weeklyDistanceGoal({
          achieved: true,
          currentValue: 42_000,
          percentComplete: 100,
        }),
      ],
      now: new Date("2026-06-18T08:00:00.000Z"),
      weeklyDistance: weeklyDistance({ thisWeekDistanceMeters: 42_000 }),
    });

    expect(focus).toMatchObject({
      action: "Controlled easy volume",
      status: "complete",
      title: "Protect the win.",
      tone: "good",
    });
  });

  it("backs off when current volume is sharply ahead of last week", () => {
    const focus = buildDashboardWeeklyFocus({
      activityCount: 3,
      distanceMeters: 25_000,
      equipment: [],
      goals: [],
      now: new Date("2026-06-18T08:00:00.000Z"),
      weeklyDistance: weeklyDistance({
        distanceDeltaMeters: 10_000,
        lastWeekAtSamePointDistanceMeters: 20_000,
        thisWeekDistanceMeters: 30_000,
      }),
    });

    expect(focus).toMatchObject({
      action: "Easy run or rest",
      status: "recover",
      title: "Ease off.",
      tone: "warn",
    });
    expect(focus.reasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "volume", label: "+50% vs last week" }),
      ]),
    );
  });

  it("warns about equipment near retirement", () => {
    const focus = buildDashboardWeeklyFocus({
      activityCount: 2,
      distanceMeters: 12_000,
      equipment: [
        equipmentItem({
          name: "Pegasus",
          retirementDistanceMeters: 700_000,
          usageDistanceMeters: 650_000,
        }),
      ],
      goals: [],
      now: new Date("2026-06-18T08:00:00.000Z"),
      weeklyDistance: weeklyDistance({ thisWeekDistanceMeters: 12_000 }),
    });

    expect(focus.reasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "equipment",
          label: "Check Pegasus",
          tone: "warn",
        }),
      ]),
    );
  });
});

function weeklyDistance(
  overrides: Partial<DashboardWeeklyDistance> = {},
): DashboardWeeklyDistance {
  return {
    averageWeeklyDistanceMeters: 10_000,
    distanceDeltaMeters: 0,
    lastWeekAtSamePointDistanceMeters: 0,
    thisWeekDistanceMeters: 0,
    weekEndAt: new Date("2026-06-21T14:00:00.000Z"),
    weekStartAt: new Date("2026-06-14T14:00:00.000Z"),
    weeklyDistanceBuckets: [],
    ...overrides,
  };
}

function weeklyDistanceGoal(
  overrides: Partial<TrainingGoalProgress> = {},
): TrainingGoalProgress {
  const now = new Date("2026-06-15T08:00:00.000Z");

  return {
    achieved: false,
    archivedAt: null,
    createdAt: now,
    currentValue: 0,
    effectiveFromPeriodStartAt: new Date("2026-06-14T14:00:00.000Z"),
    effectiveUntilPeriodStartAt: null,
    id: 1,
    metric: "distance",
    percentComplete: 0,
    period: "trainingWeek",
    periodEndAt: new Date("2026-06-21T14:00:00.000Z"),
    periodStartAt: new Date("2026-06-14T14:00:00.000Z"),
    sportScope: "running",
    targetValue: 40_000,
    trainingGoalVersionId: 1,
    updatedAt: now,
    ...overrides,
  };
}

function equipmentItem(overrides: Partial<Equipment> = {}): Equipment {
  const now = new Date("2026-06-15T08:00:00.000Z");

  return {
    activityCount: 12,
    createdAt: now,
    equipmentType: "shoes",
    id: 1,
    name: "Shoes",
    retiredAt: null,
    retirementDistanceMeters: null,
    startingDistanceMeters: 0,
    updatedAt: now,
    usageDistanceMeters: 0,
    userId: "user-id",
    ...overrides,
  };
}
