import {
  getNextTrainingWeekStartAt,
  getTrainingWeekStartAt,
} from "../activities/weekly-training-summaries/training-week";
import {
  activityBelongsToUser,
  archiveTrainingNoteTagRecord,
  createTrainingNoteRecord,
  createTrainingNoteTagRecord,
  deleteTrainingNoteRecord,
  getTrainingNoteForUser,
  listTrainingNoteTagIdsForNote,
  listTrainingNoteTagsByIds,
  replaceTrainingNoteTagAssignments,
  restoreTrainingNoteTagRecord,
  type TrainingNoteDatabase,
  touchTrainingNoteRecord,
  transaction,
  updateTrainingNoteRecord,
  updateTrainingNoteTagRecord,
} from "./training-notes.repository";
import {
  TrainingNoteNotFoundError,
  type TrainingNoteTagColor,
  TrainingNoteTagError,
  TrainingNoteTargetError,
  TrainingNoteTextError,
} from "./training-notes.types";

const trainingNoteTextMaxLength = 2000;

export async function createTrainingNote({
  activityId,
  now = new Date(),
  tagIds = [],
  text,
  userId,
  weekStartAt,
}: {
  activityId?: number;
  now?: Date;
  tagIds?: number[];
  text: string;
  userId: string;
  weekStartAt?: Date;
}) {
  const trimmedText = readTrainingNoteText(text);
  const uniqueTagIds = readUniqueTagIds(tagIds);

  assertTrainingNoteHasContent({
    tagIds: uniqueTagIds,
    text: trimmedText,
  });
  await assertValidTrainingNoteTarget({
    activityId,
    now,
    userId,
    weekStartAt,
  });

  return transaction(async (database) => {
    await assertTagAssignmentsAreValid({
      database,
      tagIds: uniqueTagIds,
      userId,
    });

    const note = await createTrainingNoteRecord({
      activityId,
      database,
      text: trimmedText,
      userId,
      weekStartAt,
    });

    await replaceTrainingNoteTagAssignments({
      database,
      noteId: note.id,
      tagIds: uniqueTagIds,
    });

    return {
      ...note,
      tags: await listTrainingNoteTagsByIds({
        database,
        tagIds: uniqueTagIds,
        userId,
      }),
    };
  });
}

export async function updateTrainingNote({
  id,
  tagIds = [],
  text,
  userId,
}: {
  id: number;
  tagIds?: number[];
  text: string;
  userId: string;
}) {
  const trimmedText = readTrainingNoteText(text);
  const uniqueTagIds = readUniqueTagIds(tagIds);

  assertTrainingNoteHasContent({
    tagIds: uniqueTagIds,
    text: trimmedText,
  });

  return transaction(async (database) => {
    const existingNote = await getTrainingNoteForUser({ database, id, userId });

    if (!existingNote) {
      throw new TrainingNoteNotFoundError();
    }

    const currentTagIds = await listTrainingNoteTagIdsForNote({
      database,
      noteId: id,
    });

    await assertTagAssignmentsAreValid({
      allowedArchivedTagIds: currentTagIds,
      database,
      tagIds: uniqueTagIds,
      userId,
    });

    const note = await updateTrainingNoteRecord({
      database,
      id,
      text: trimmedText,
      userId,
    });

    if (!note) {
      throw new TrainingNoteNotFoundError();
    }

    await replaceTrainingNoteTagAssignments({
      database,
      noteId: id,
      tagIds: uniqueTagIds,
    });
    await touchTrainingNoteRecord({ database, id });

    return {
      ...note,
      tags: await listTrainingNoteTagsByIds({
        database,
        tagIds: uniqueTagIds,
        userId,
      }),
    };
  });
}

export async function deleteTrainingNote({
  id,
  userId,
}: {
  id: number;
  userId: string;
}) {
  const deleted = await deleteTrainingNoteRecord({ id, userId });

  if (!deleted) {
    throw new TrainingNoteNotFoundError();
  }

  return { deleted: true };
}

export async function createTrainingNoteTag({
  color,
  name,
  userId,
}: {
  color: TrainingNoteTagColor;
  name: string;
  userId: string;
}) {
  try {
    return await createTrainingNoteTagRecord({
      color,
      name: readTrainingNoteTagName(name),
      userId,
    });
  } catch (error) {
    throw toTrainingNoteTagError(error);
  }
}

export async function updateTrainingNoteTag({
  color,
  id,
  name,
  userId,
}: {
  color: TrainingNoteTagColor;
  id: number;
  name: string;
  userId: string;
}) {
  try {
    const tag = await updateTrainingNoteTagRecord({
      color,
      id,
      name: readTrainingNoteTagName(name),
      userId,
    });

    if (!tag) {
      throw new TrainingNoteTagError("Training Note Tag was not found.");
    }

    return tag;
  } catch (error) {
    throw toTrainingNoteTagError(error);
  }
}

export async function archiveTrainingNoteTag({
  id,
  now = new Date(),
  userId,
}: {
  id: number;
  now?: Date;
  userId: string;
}) {
  const archived = await archiveTrainingNoteTagRecord({
    archivedAt: now,
    id,
    userId,
  });

  if (!archived) {
    throw new TrainingNoteTagError("Training Note Tag was not found.");
  }

  return { archived: true };
}

export async function restoreTrainingNoteTag({
  id,
  userId,
}: {
  id: number;
  userId: string;
}) {
  const restored = await restoreTrainingNoteTagRecord({ id, userId });

  if (!restored) {
    throw new TrainingNoteTagError("Training Note Tag was not found.");
  }

  return { restored: true };
}

export function assertValidTrainingWeekTarget({
  now,
  weekStartAt,
}: {
  now: Date;
  weekStartAt: Date;
}) {
  const normalizedWeekStartAt = getTrainingWeekStartAt(weekStartAt);

  if (normalizedWeekStartAt.getTime() !== weekStartAt.getTime()) {
    throw new TrainingNoteTargetError(
      "Training Note week target must be a Training Week start.",
    );
  }

  const currentWeekStartAt = getTrainingWeekStartAt(now);
  const nextWeekStartAt = getNextTrainingWeekStartAt(currentWeekStartAt);

  if (weekStartAt >= nextWeekStartAt) {
    throw new TrainingNoteTargetError(
      "Training Note cannot target a future Training Week.",
    );
  }
}

async function assertValidTrainingNoteTarget({
  activityId,
  now,
  userId,
  weekStartAt,
}: {
  activityId?: number;
  now: Date;
  userId: string;
  weekStartAt?: Date;
}) {
  if (activityId !== undefined && weekStartAt !== undefined) {
    throw new TrainingNoteTargetError(
      "Training Note must have exactly one target.",
    );
  }

  if (activityId === undefined && weekStartAt === undefined) {
    throw new TrainingNoteTargetError(
      "Training Note must have exactly one target.",
    );
  }

  if (activityId !== undefined) {
    const targetExists = await activityBelongsToUser({ activityId, userId });

    if (!targetExists) {
      throw new TrainingNoteTargetError(
        "Training Note Activity target was not found.",
      );
    }
  }

  if (weekStartAt !== undefined) {
    assertValidTrainingWeekTarget({ now, weekStartAt });
  }
}

async function assertTagAssignmentsAreValid({
  allowedArchivedTagIds = [],
  database,
  tagIds,
  userId,
}: {
  allowedArchivedTagIds?: number[];
  database: TrainingNoteDatabase;
  tagIds: number[];
  userId: string;
}) {
  const tags = await listTrainingNoteTagsByIds({ database, tagIds, userId });

  if (tags.length !== tagIds.length) {
    throw new TrainingNoteTagError("Training Note Tag was not found.");
  }

  const allowedArchivedTagIdSet = new Set(allowedArchivedTagIds);

  for (const tag of tags) {
    if (tag.archivedAt && !allowedArchivedTagIdSet.has(tag.id)) {
      throw new TrainingNoteTagError(
        "Archived Training Note Tags cannot be assigned.",
      );
    }
  }
}

function assertTrainingNoteHasContent({
  tagIds,
  text,
}: {
  tagIds: number[];
  text: string;
}) {
  if (text.length === 0 && tagIds.length === 0) {
    throw new TrainingNoteTextError("Training Note needs text, tags, or both.");
  }
}

function readTrainingNoteText(text: string) {
  const trimmedText = text.trim();

  if (trimmedText.length > trainingNoteTextMaxLength) {
    throw new TrainingNoteTextError("Training Note text is too long.");
  }

  return trimmedText;
}

function readUniqueTagIds(tagIds: number[]) {
  return [...new Set(tagIds)];
}

function readTrainingNoteTagName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function toTrainingNoteTagError(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "constraint" in error &&
    error.constraint === "training_note_tags_user_name_lower_idx"
  ) {
    return new TrainingNoteTagError(
      "A Training Note Tag with this name already exists.",
    );
  }

  return error;
}
