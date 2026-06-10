import {
  listRecentTrainingNotes,
  listTrainingNotesForActivity,
  listTrainingNotesForTrainingWeek,
} from "@korex/api/modules/training-notes/training-notes.repository";
import {
  createTrainingNote,
  deleteTrainingNote,
  updateTrainingNote,
} from "@korex/api/modules/training-notes/training-notes.service";
import {
  TrainingNoteNotFoundError,
  TrainingNoteTargetError,
  TrainingNoteTextError,
} from "@korex/api/modules/training-notes/training-notes.types";
import { activities, db, trainingNotes, user } from "@korex/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ActivityBuilder } from "../../setup/integration/test-data/activity-builder";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("training notes service", () => {
  it("creates Activity notes for any owned Activity sport type", async () => {
    const userId = userDataExtensions.HughJass.id;

    await DataSeedAsync.withActivities(
      ActivityBuilder.initWithUser(userId)
        .withId(3101)
        .withSportType("hike")
        .build(),
    ).seedAsync();

    const note = await createTrainingNote({
      activityId: 3101,
      text: "  Felt good on the climb.  ",
      userId,
    });

    expect(note).toMatchObject({
      activityId: 3101,
      targetType: "activity",
      text: "Felt good on the climb.",
      userId,
      weekStartAt: null,
    });
    await expect(
      listTrainingNotesForActivity({ activityId: 3101, userId }),
    ).resolves.toMatchObject([{ text: "Felt good on the climb." }]);
  });

  it("creates Training Week notes without a Weekly Training Summary or Activities", async () => {
    const userId = userDataExtensions.HughJass.id;
    const weekStartAt = new Date("2026-05-10T14:00:00.000Z");

    const note = await createTrainingNote({
      now: new Date("2026-05-13T03:00:00.000Z"),
      text: "Keep the easy days genuinely easy.",
      userId,
      weekStartAt,
    });

    expect(note).toMatchObject({
      activityId: null,
      targetType: "trainingWeek",
      text: "Keep the easy days genuinely easy.",
      weekStartAt,
    });
    await expect(
      listTrainingNotesForTrainingWeek({ userId, weekStartAt }),
    ).resolves.toMatchObject([{ text: "Keep the easy days genuinely easy." }]);
  });

  it("rejects invalid targets and invalid text", async () => {
    const userId = userDataExtensions.HughJass.id;

    await DataSeedAsync.withActivities(
      ActivityBuilder.initWithUser(userId).withId(3111).build(),
    ).seedAsync();

    await expect(
      createTrainingNote({
        activityId: 3111,
        text: "Too many targets",
        userId,
        weekStartAt: new Date("2026-05-10T14:00:00.000Z"),
      }),
    ).rejects.toBeInstanceOf(TrainingNoteTargetError);
    await expect(
      createTrainingNote({
        text: "No target",
        userId,
      }),
    ).rejects.toBeInstanceOf(TrainingNoteTargetError);
    await expect(
      createTrainingNote({
        activityId: 3111,
        text: "   ",
        userId,
      }),
    ).rejects.toBeInstanceOf(TrainingNoteTextError);
  });

  it("rejects Activity targets owned by another User", async () => {
    const otherUser = {
      email: "training-notes-other@example.com",
      id: "training-notes-other-user-id",
      name: "Training Notes Other User",
    };

    await db.insert(user).values(otherUser);
    await DataSeedAsync.withActivities(
      ActivityBuilder.initWithUser(otherUser.id).withId(3121).build(),
    ).seedAsync();

    await expect(
      createTrainingNote({
        activityId: 3121,
        text: "Not mine",
        userId: userDataExtensions.HughJass.id,
      }),
    ).rejects.toBeInstanceOf(TrainingNoteTargetError);
  });

  it("rejects non-week-start and future Training Week targets", async () => {
    const userId = userDataExtensions.HughJass.id;

    await expect(
      createTrainingNote({
        now: new Date("2026-05-13T03:00:00.000Z"),
        text: "Wednesday is not a Training Week start",
        userId,
        weekStartAt: new Date("2026-05-13T14:00:00.000Z"),
      }),
    ).rejects.toBeInstanceOf(TrainingNoteTargetError);
    await expect(
      createTrainingNote({
        now: new Date("2026-05-13T03:00:00.000Z"),
        text: "Future planning is not v1 notes",
        userId,
        weekStartAt: new Date("2026-05-17T14:00:00.000Z"),
      }),
    ).rejects.toBeInstanceOf(TrainingNoteTargetError);
  });

  it("updates and deletes only notes owned by the User", async () => {
    const userId = userDataExtensions.HughJass.id;
    const note = await createTrainingNote({
      now: new Date("2026-05-13T03:00:00.000Z"),
      text: "Original note",
      userId,
      weekStartAt: new Date("2026-05-10T14:00:00.000Z"),
    });

    await expect(
      updateTrainingNote({
        id: note.id,
        text: "Updated note",
        userId,
      }),
    ).resolves.toMatchObject({ text: "Updated note" });
    await expect(
      updateTrainingNote({
        id: note.id,
        text: "Hijack",
        userId: "missing-user",
      }),
    ).rejects.toBeInstanceOf(TrainingNoteNotFoundError);
    await expect(
      deleteTrainingNote({ id: note.id, userId: "missing-user" }),
    ).rejects.toBeInstanceOf(TrainingNoteNotFoundError);
    await expect(deleteTrainingNote({ id: note.id, userId })).resolves.toEqual({
      deleted: true,
    });
  });

  it("deletes Activity-attached notes when the Activity is deleted", async () => {
    const userId = userDataExtensions.HughJass.id;

    await DataSeedAsync.withActivities(
      ActivityBuilder.initWithUser(userId).withId(3131).build(),
    ).seedAsync();
    await createTrainingNote({
      activityId: 3131,
      text: "Will go with the Activity",
      userId,
    });

    await db.delete(activities).where(eq(activities.id, 3131));

    await expect(db.select().from(trainingNotes)).resolves.toEqual([]);
  });

  it("lists recent notes across Activity and Training Week targets", async () => {
    const userId = userDataExtensions.HughJass.id;

    await DataSeedAsync.withActivities(
      ActivityBuilder.initWithUser(userId)
        .withId(3141)
        .withName("Tempo run")
        .build(),
    ).seedAsync();
    await createTrainingNote({
      now: new Date("2026-05-13T03:00:00.000Z"),
      text: "Week note",
      userId,
      weekStartAt: new Date("2026-05-10T14:00:00.000Z"),
    });
    await createTrainingNote({
      activityId: 3141,
      text: "Activity note",
      userId,
    });

    await expect(listRecentTrainingNotes({ userId })).resolves.toMatchObject([
      {
        targetLabel: "Tempo run",
        targetType: "activity",
        text: "Activity note",
      },
      {
        targetType: "trainingWeek",
        text: "Week note",
      },
    ]);
  });
});
