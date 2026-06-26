import type {
  TrainingNote,
  TrainingNoteTag,
} from "@korex/api/modules/training-notes/training-notes.types";
import type { QueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

function invalidateTrainingNoteQueries(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
) {
  queryClient.invalidateQueries({ queryKey });
  queryClient.invalidateQueries({
    queryKey: orpc.trainingNotes.recent.queryOptions().queryKey,
  });
  queryClient.invalidateQueries({
    queryKey: orpc.activities.recent.queryOptions().queryKey,
  });
}

function formatNoteTimestamp(value: Date | string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function formatCompactDate(value: Date | string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function getTagsUsedByNotes(notes: TrainingNote[]) {
  const tagsById = new Map<number, TrainingNoteTag>();

  for (const note of notes) {
    for (const tag of note.tags) {
      tagsById.set(tag.id, tag);
    }
  }

  return [...tagsById.values()].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

function filterNotesByTags(notes: TrainingNote[], tagIds: number[]) {
  if (tagIds.length === 0) {
    return notes;
  }

  const tagIdSet = new Set(tagIds);
  return notes.filter((note) => note.tags.some((tag) => tagIdSet.has(tag.id)));
}

export {
  filterNotesByTags,
  formatCompactDate,
  formatNoteTimestamp,
  getTagsUsedByNotes,
  invalidateTrainingNoteQueries,
};
