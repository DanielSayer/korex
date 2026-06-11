import {
  activities,
  db,
  trainingNotes,
  trainingNoteTagAssignments,
  trainingNoteTags,
} from "@korex/db";
import { and, asc, desc, eq, gte, inArray, isNull, lt } from "drizzle-orm";
import type { TrainingNote, TrainingNoteTag } from "./training-notes.types";

export type TrainingNoteDatabase = Pick<
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

const trainingNoteTagSelect = {
  archivedAt: trainingNoteTags.archivedAt,
  color: trainingNoteTags.color,
  createdAt: trainingNoteTags.createdAt,
  id: trainingNoteTags.id,
  name: trainingNoteTags.name,
  updatedAt: trainingNoteTags.updatedAt,
  userId: trainingNoteTags.userId,
};

export async function transaction<T>(
  callback: (database: TrainingNoteDatabase) => Promise<T>,
) {
  return db.transaction(callback);
}

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

  return toTrainingNote({
    ...note,
    tags: [],
    targetLabel: null,
    targetStartAt: null,
  });
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

  return hydrateTrainingNotes(notes);
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

  return hydrateTrainingNotes(notes);
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

  return hydrateTrainingNotes(notes);
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

  return hydrateTrainingNotes(notes);
}

export async function getTrainingNoteForUser({
  database = db,
  id,
  userId,
}: {
  database?: TrainingNoteDatabase;
  id: number;
  userId: string;
}) {
  const [note] = await database
    .select({
      id: trainingNotes.id,
      text: trainingNotes.text,
    })
    .from(trainingNotes)
    .where(and(eq(trainingNotes.id, id), eq(trainingNotes.userId, userId)))
    .limit(1);

  return note ?? null;
}

export async function updateTrainingNoteRecord({
  database = db,
  id,
  text,
  userId,
}: {
  database?: TrainingNoteDatabase;
  id: number;
  text: string;
  userId: string;
}): Promise<TrainingNote | null> {
  const [note] = await database
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
    ? toTrainingNote({
        ...note,
        tags: [],
        targetLabel: null,
        targetStartAt: null,
      })
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

export async function listTrainingNoteTags({
  includeArchived = false,
  userId,
}: {
  includeArchived?: boolean;
  userId: string;
}): Promise<TrainingNoteTag[]> {
  const rows = await db
    .select(trainingNoteTagSelect)
    .from(trainingNoteTags)
    .where(
      includeArchived
        ? eq(trainingNoteTags.userId, userId)
        : and(
            eq(trainingNoteTags.userId, userId),
            isNull(trainingNoteTags.archivedAt),
          ),
    )
    .orderBy(asc(trainingNoteTags.name), asc(trainingNoteTags.id));

  return rows.map(toTrainingNoteTag);
}

export async function listTrainingNoteTagsByIds({
  database = db,
  tagIds,
  userId,
}: {
  database?: TrainingNoteDatabase;
  tagIds: number[];
  userId: string;
}): Promise<TrainingNoteTag[]> {
  if (tagIds.length === 0) {
    return [];
  }

  const rows = await database
    .select(trainingNoteTagSelect)
    .from(trainingNoteTags)
    .where(
      and(
        eq(trainingNoteTags.userId, userId),
        inArray(trainingNoteTags.id, tagIds),
      ),
    );

  return rows.map(toTrainingNoteTag);
}

export async function listTrainingNoteTagIdsForNote({
  database = db,
  noteId,
}: {
  database?: TrainingNoteDatabase;
  noteId: number;
}) {
  const rows = await database
    .select({ tagId: trainingNoteTagAssignments.trainingNoteTagId })
    .from(trainingNoteTagAssignments)
    .where(eq(trainingNoteTagAssignments.trainingNoteId, noteId));

  return rows.map((row) => row.tagId);
}

export async function replaceTrainingNoteTagAssignments({
  database,
  noteId,
  tagIds,
}: {
  database: TrainingNoteDatabase;
  noteId: number;
  tagIds: number[];
}) {
  await database
    .delete(trainingNoteTagAssignments)
    .where(eq(trainingNoteTagAssignments.trainingNoteId, noteId));

  if (tagIds.length === 0) {
    return;
  }

  await database.insert(trainingNoteTagAssignments).values(
    tagIds.map((tagId) => ({
      trainingNoteId: noteId,
      trainingNoteTagId: tagId,
    })),
  );
}

export async function touchTrainingNoteRecord({
  database,
  id,
}: {
  database: TrainingNoteDatabase;
  id: number;
}) {
  await database
    .update(trainingNotes)
    .set({ updatedAt: new Date() })
    .where(eq(trainingNotes.id, id));
}

export async function createTrainingNoteTagRecord({
  color,
  name,
  userId,
}: {
  color: string;
  name: string;
  userId: string;
}): Promise<TrainingNoteTag> {
  const [tag] = await db
    .insert(trainingNoteTags)
    .values({ color, name, userId })
    .returning(trainingNoteTagSelect);

  if (!tag) {
    throw new Error("Failed to create Training Note Tag");
  }

  return toTrainingNoteTag(tag);
}

export async function updateTrainingNoteTagRecord({
  color,
  id,
  name,
  userId,
}: {
  color: string;
  id: number;
  name: string;
  userId: string;
}): Promise<TrainingNoteTag | null> {
  const [tag] = await db
    .update(trainingNoteTags)
    .set({ color, name, updatedAt: new Date() })
    .where(
      and(eq(trainingNoteTags.id, id), eq(trainingNoteTags.userId, userId)),
    )
    .returning(trainingNoteTagSelect);

  return tag ? toTrainingNoteTag(tag) : null;
}

export async function archiveTrainingNoteTagRecord({
  archivedAt,
  id,
  userId,
}: {
  archivedAt: Date;
  id: number;
  userId: string;
}) {
  const [tag] = await db
    .update(trainingNoteTags)
    .set({ archivedAt, updatedAt: new Date() })
    .where(
      and(eq(trainingNoteTags.id, id), eq(trainingNoteTags.userId, userId)),
    )
    .returning({ id: trainingNoteTags.id });

  return Boolean(tag);
}

export async function restoreTrainingNoteTagRecord({
  id,
  userId,
}: {
  id: number;
  userId: string;
}) {
  const [tag] = await db
    .update(trainingNoteTags)
    .set({ archivedAt: null, updatedAt: new Date() })
    .where(
      and(eq(trainingNoteTags.id, id), eq(trainingNoteTags.userId, userId)),
    )
    .returning({ id: trainingNoteTags.id });

  return Boolean(tag);
}

function toTrainingNote(note: {
  activityId: number | null;
  createdAt: Date;
  id: number;
  tags: TrainingNoteTag[];
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

async function hydrateTrainingNotes(
  notes: Array<Omit<Parameters<typeof toTrainingNote>[0], "tags">>,
): Promise<TrainingNote[]> {
  if (notes.length === 0) {
    return [];
  }

  const noteIds = notes.map((note) => note.id);
  const tagRows = await db
    .select({
      ...trainingNoteTagSelect,
      noteId: trainingNoteTagAssignments.trainingNoteId,
    })
    .from(trainingNoteTagAssignments)
    .innerJoin(
      trainingNoteTags,
      eq(trainingNoteTagAssignments.trainingNoteTagId, trainingNoteTags.id),
    )
    .where(inArray(trainingNoteTagAssignments.trainingNoteId, noteIds))
    .orderBy(asc(trainingNoteTags.name), asc(trainingNoteTags.id));
  const tagsByNoteId = new Map<number, TrainingNoteTag[]>();

  for (const row of tagRows) {
    const noteTags = tagsByNoteId.get(row.noteId) ?? [];
    noteTags.push(toTrainingNoteTag(row));
    tagsByNoteId.set(row.noteId, noteTags);
  }

  return notes.map((note) =>
    toTrainingNote({
      ...note,
      tags: tagsByNoteId.get(note.id) ?? [],
    }),
  );
}

function toTrainingNoteTag(tag: {
  archivedAt: Date | null;
  color: string;
  createdAt: Date;
  id: number;
  name: string;
  updatedAt: Date;
  userId: string;
}): TrainingNoteTag {
  return {
    ...tag,
    color: tag.color as TrainingNoteTag["color"],
  };
}
