import {
  assignDefaultEquipmentForActivity,
  listDefaultEquipment,
  listEquipment,
} from "@korex/api/modules/equipment/equipment.repository";
import {
  assignActivityEquipment,
  bulkAssignEquipment,
  createEquipment,
  retireEquipment,
  setDefaultEquipment,
} from "@korex/api/modules/equipment/equipment.service";
import { db, user } from "@korex/db";
import { describe, expect, it } from "vitest";
import { ActivityBuilder } from "../../setup/integration/test-data/activity-builder";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("equipment service", () => {
  it("tracks live usage distance from starting distance and assigned Activities", async () => {
    const userId = userDataExtensions.HughJass.id;

    const shoes = await createEquipment({
      equipmentType: "shoes",
      name: "Novablast 5",
      retirementDistanceMeters: 700_000,
      startingDistanceMeters: 42_000,
      userId,
    });

    await DataSeedAsync.withActivities(
      ActivityBuilder.initWithUser(userId)
        .withId(9101)
        .withDistanceMeters(10_000)
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(9102)
        .withDistanceMeters(12_500)
        .build(),
    ).seedAsync();

    await assignActivityEquipment({
      activityId: 9101,
      equipmentId: shoes.id,
      userId,
    });
    await assignActivityEquipment({
      activityId: 9102,
      equipmentId: shoes.id,
      userId,
    });

    await expect(listEquipment({ userId })).resolves.toMatchObject([
      {
        activityCount: 2,
        equipmentType: "shoes",
        name: "Novablast 5",
        retirementDistanceMeters: 700_000,
        startingDistanceMeters: 42_000,
        usageDistanceMeters: 64_500,
      },
    ]);
  });

  it("assigns Default Equipment only when an Activity has no matching Equipment Type", async () => {
    const userId = userDataExtensions.HughJass.id;

    const defaultShoes = await createEquipment({
      equipmentType: "shoes",
      name: "Default shoes",
      userId,
    });
    const manualShoes = await createEquipment({
      equipmentType: "shoes",
      name: "Manual shoes",
      userId,
    });

    await setDefaultEquipment({
      equipmentId: defaultShoes.id,
      sportType: "run",
      userId,
    });
    await DataSeedAsync.withActivities(
      ActivityBuilder.initWithUser(userId)
        .withId(9111)
        .withDistanceMeters(5000)
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(9112)
        .withDistanceMeters(8000)
        .build(),
    ).seedAsync();
    await assignActivityEquipment({
      activityId: 9112,
      equipmentId: manualShoes.id,
      userId,
    });

    await assignDefaultEquipmentForActivity({
      activityId: 9111,
      sportType: "run",
      userId,
    });
    await assignDefaultEquipmentForActivity({
      activityId: 9112,
      sportType: "run",
      userId,
    });

    await expect(listEquipment({ userId })).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: defaultShoes.id,
          activityCount: 1,
          usageDistanceMeters: 5000,
        }),
        expect.objectContaining({
          id: manualShoes.id,
          activityCount: 1,
          usageDistanceMeters: 8000,
        }),
      ]),
    );
  });

  it("bulk assigns Equipment by date range, sport type, and unassigned-only", async () => {
    const userId = userDataExtensions.HughJass.id;

    const shoes = await createEquipment({
      equipmentType: "shoes",
      name: "Bulk shoes",
      userId,
    });
    const otherShoes = await createEquipment({
      equipmentType: "shoes",
      name: "Other shoes",
      userId,
    });

    await DataSeedAsync.withActivities(
      ActivityBuilder.initWithUser(userId)
        .withId(9121)
        .withStartAt(new Date("2026-05-01T00:00:00.000Z"))
        .withDistanceMeters(4000)
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(9122)
        .withStartAt(new Date("2026-05-02T00:00:00.000Z"))
        .withDistanceMeters(6000)
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(9123)
        .withSportType("hike")
        .withStartAt(new Date("2026-05-03T00:00:00.000Z"))
        .withDistanceMeters(10_000)
        .build(),
      ActivityBuilder.initWithUser(userId)
        .withId(9124)
        .withStartAt(new Date("2026-06-01T00:00:00.000Z"))
        .withDistanceMeters(12_000)
        .build(),
    ).seedAsync();
    await assignActivityEquipment({
      activityId: 9122,
      equipmentId: otherShoes.id,
      userId,
    });

    await expect(
      bulkAssignEquipment({
        endAt: new Date("2026-05-31T00:00:00.000Z"),
        equipmentId: shoes.id,
        sportType: "run",
        startAt: new Date("2026-05-01T00:00:00.000Z"),
        unassignedOnly: true,
        userId,
      }),
    ).resolves.toEqual({ assignedCount: 1 });

    await expect(listEquipment({ userId })).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: shoes.id,
          activityCount: 1,
          usageDistanceMeters: 4000,
        }),
        expect.objectContaining({
          id: otherShoes.id,
          activityCount: 1,
          usageDistanceMeters: 6000,
        }),
      ]),
    );
  });

  it("retiring Equipment clears it as Default Equipment but keeps historical use", async () => {
    const userId = userDataExtensions.HughJass.id;

    const shoes = await createEquipment({
      equipmentType: "shoes",
      name: "Retired shoes",
      userId,
    });

    await DataSeedAsync.withActivities(
      ActivityBuilder.initWithUser(userId)
        .withId(9131)
        .withDistanceMeters(9000)
        .build(),
    ).seedAsync();
    await assignActivityEquipment({
      activityId: 9131,
      equipmentId: shoes.id,
      userId,
    });
    await setDefaultEquipment({
      equipmentId: shoes.id,
      sportType: "run",
      userId,
    });

    await retireEquipment({
      id: shoes.id,
      now: new Date("2026-06-01T00:00:00.000Z"),
      userId,
    });

    await expect(listDefaultEquipment({ userId })).resolves.toEqual([]);
    await expect(listEquipment({ userId })).resolves.toEqual([
      expect.objectContaining({
        activityCount: 1,
        retiredAt: new Date("2026-06-01T00:00:00.000Z"),
        usageDistanceMeters: 9000,
      }),
    ]);
  });

  it("does not allow assigning Equipment to another user's Activity", async () => {
    const userId = userDataExtensions.HughJass.id;
    const otherUser = {
      email: "equipment-other@example.com",
      id: "equipment-other-user-id",
      name: "Equipment Other User",
    };

    await db.insert(user).values(otherUser);
    const shoes = await createEquipment({
      equipmentType: "shoes",
      name: "Boundary shoes",
      userId,
    });
    await DataSeedAsync.withActivities(
      ActivityBuilder.initWithUser(otherUser.id)
        .withId(9141)
        .withDistanceMeters(7000)
        .build(),
    ).seedAsync();

    await expect(
      assignActivityEquipment({
        activityId: 9141,
        equipmentId: shoes.id,
        userId,
      }),
    ).rejects.toThrow("Activity was not found");
  });
});
