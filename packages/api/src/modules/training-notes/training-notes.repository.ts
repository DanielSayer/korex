import { activities, db, trainingNotes } from "@korex/db";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import type { TrainingNote } from "./training-notes.types";

type TrainingNoteDatabase = Pick<
  typeof db,
  "delete" | "insert" | "select" | "update"
>;

const trainingNoteSelect = {
  activityId: trainingNotes.activityId,
  createdAt: trainingNotes.createdAt,
  id: trainingNotes.id,
  targetLabel: activities.name,
  targetStartAt: activities.startAt,
  text: trainingNotes.text,
  updatedAt: trainingNotes.updatedAt,
  userId: trainingNotes.userId,
  weekStartAt: trainingNotes.weekStartAt,
};

export async function activityBelongsToUser({
  activityId,
  userId,
}: {
  activityId: number;
  userId: string;
}) {
  const [activity] = await db
    .select({ id: activities.id })
    .from(activities)
    .where(and(eq(activities.id, activityId), eq(activities.userId, userId)))
    .limit(1);

  return Boolean(activity);
}

export async function createTrainingNoteRecord({
  activityId,
  database = db,
  text,
  userId,
  weekStartAt,
}: {
  activityId?: number;
  database?: TrainingNoteDatabase;
  text: string;
  userId: string;
  weekStartAt?: Date;
}): Promise<TrainingNote> {
  const [note] = await database
    .insert(trainingNotes)
    .values({
      activityId,
      text,
      userId,
      weekStartAt,
    })
    .returning({
      activityId: trainingNotes.activityId,
      createdAt: trainingNotes.createdAt,
      id: trainingNotes.id,
      text: trainingNotes.text,
      updatedAt: trainingNotes.updatedAt,
      userId: trainingNotes.userId,
      weekStartAt: trainingNotes.weekStartAt,
    });

  if (!note) {
    throw new Error("Failed to create Training Note");
  }

  return toTrainingNote({ ...note, targetLabel: null, targetStartAt: null });
}

export async function listTrainingNotesForActivity({
  activityId,
  userId,
}: {
  activityId: number;
  userId: string;
}): Promise<TrainingNote[]> {
  const notes = await db
    .select(trainingNoteSelect)
    .from(trainingNotes)
    .leftJoin(activities, eq(trainingNotes.activityId, activities.id))
    .where(
      and(
        eq(trainingNotes.userId, userId),
        eq(trainingNotes.activityId, activityId),
      ),
    )
    .orderBy(desc(trainingNotes.createdAt), desc(trainingNotes.id));

  return notes.map(toTrainingNote);
}

export async function listTrainingNotesForTrainingWeek({
  userId,
  weekStartAt,
}: {
  userId: string;
  weekStartAt: Date;
}): Promise<TrainingNote[]> {
  const notes = await db
    .select(trainingNoteSelect)
    .from(trainingNotes)
    .leftJoin(activities, eq(trainingNotes.activityId, activities.id))
    .where(
      and(
        eq(trainingNotes.userId, userId),
        eq(trainingNotes.weekStartAt, weekStartAt),
      ),
    )
    .orderBy(desc(trainingNotes.createdAt), desc(trainingNotes.id));

  return notes.map(toTrainingNote);
}

export async function listActivityTrainingNotesForTrainingWeek({
  userId,
  weekEndAt,
  weekStartAt,
}: {
  userId: string;
  weekEndAt: Date;
  weekStartAt: Date;
}): Promise<TrainingNote[]> {
  const notes = await db
    .select(trainingNoteSelect)
    .from(trainingNotes)
    .innerJoin(activities, eq(trainingNotes.activityId, activities.id))
    .where(
      and(
        eq(trainingNotes.userId, userId),
        eq(activities.userId, userId),
        gte(activities.startAt, weekStartAt),
        lt(activities.startAt, weekEndAt),
      ),
    )
    .orderBy(
      desc(activities.startAt),
      desc(trainingNotes.createdAt),
      desc(trainingNotes.id),
    );

  return notes.map(toTrainingNote);
}

export async function listRecentTrainingNotes({
  limit = 5,
  userId,
}: {
  limit?: number;
  userId: string;
}): Promise<TrainingNote[]> {
  const notes = await db
    .select(trainingNoteSelect)
    .from(trainingNotes)
    .leftJoin(activities, eq(trainingNotes.activityId, activities.id))
    .where(eq(trainingNotes.userId, userId))
    .orderBy(desc(trainingNotes.createdAt), desc(trainingNotes.id))
    .limit(limit);

  return notes.map(toTrainingNote);
}

export async function updateTrainingNoteRecord({
  id,
  text,
  userId,
}: {
  id: number;
  text: string;
  userId: string;
}): Promise<TrainingNote | null> {
  const [note] = await db
    .update(trainingNotes)
    .set({ text, updatedAt: new Date() })
    .where(and(eq(trainingNotes.id, id), eq(trainingNotes.userId, userId)))
    .returning({
      activityId: trainingNotes.activityId,
      createdAt: trainingNotes.createdAt,
      id: trainingNotes.id,
      text: trainingNotes.text,
      updatedAt: trainingNotes.updatedAt,
      userId: trainingNotes.userId,
      weekStartAt: trainingNotes.weekStartAt,
    });

  return note
    ? toTrainingNote({ ...note, targetLabel: null, targetStartAt: null })
    : null;
}

export async function deleteTrainingNoteRecord({
  id,
  userId,
}: {
  id: number;
  userId: string;
}) {
  const [deleted] = await db
    .delete(trainingNotes)
    .where(and(eq(trainingNotes.id, id), eq(trainingNotes.userId, userId)))
    .returning({ id: trainingNotes.id });

  return Boolean(deleted);
}

function toTrainingNote(note: {
  activityId: number | null;
  createdAt: Date;
  id: number;
  targetLabel: string | null;
  targetStartAt: Date | null;
  text: string;
  updatedAt: Date;
  userId: string;
  weekStartAt: Date | null;
}): TrainingNote {
  return {
    ...note,
    targetType: note.activityId === null ? "trainingWeek" : "activity",
  };
}
