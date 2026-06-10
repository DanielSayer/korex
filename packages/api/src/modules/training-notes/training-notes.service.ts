import {
  getNextTrainingWeekStartAt,
  getTrainingWeekStartAt,
} from "../activities/weekly-training-summaries/training-week";
import {
  activityBelongsToUser,
  createTrainingNoteRecord,
  deleteTrainingNoteRecord,
  updateTrainingNoteRecord,
} from "./training-notes.repository";
import {
  TrainingNoteNotFoundError,
  TrainingNoteTargetError,
  TrainingNoteTextError,
} from "./training-notes.types";

const trainingNoteTextMaxLength = 2000;

export async function createTrainingNote({
  activityId,
  now = new Date(),
  text,
  userId,
  weekStartAt,
}: {
  activityId?: number;
  now?: Date;
  text: string;
  userId: string;
  weekStartAt?: Date;
}) {
  const trimmedText = readTrainingNoteText(text);

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

  return createTrainingNoteRecord({
    activityId,
    text: trimmedText,
    userId,
    weekStartAt,
  });
}

export async function updateTrainingNote({
  id,
  text,
  userId,
}: {
  id: number;
  text: string;
  userId: string;
}) {
  const note = await updateTrainingNoteRecord({
    id,
    text: readTrainingNoteText(text),
    userId,
  });

  if (!note) {
    throw new TrainingNoteNotFoundError();
  }

  return note;
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

function readTrainingNoteText(text: string) {
  const trimmedText = text.trim();

  if (trimmedText.length === 0) {
    throw new TrainingNoteTextError("Training Note text cannot be empty.");
  }

  if (trimmedText.length > trainingNoteTextMaxLength) {
    throw new TrainingNoteTextError("Training Note text is too long.");
  }

  return trimmedText;
}
