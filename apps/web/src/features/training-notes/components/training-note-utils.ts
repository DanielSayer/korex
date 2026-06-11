import type {
  TrainingNote,
  TrainingNoteTag,
  TrainingNoteTagColor,
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

function getTrainingNoteTagClassName(color: TrainingNoteTagColor) {
  return trainingNoteTagClassNames[color];
}

function getTrainingNoteTagSwatchClassName(color: TrainingNoteTagColor) {
  return trainingNoteTagSwatchClassNames[color];
}

function nextTrainingNoteTagColor(offset: number): TrainingNoteTagColor {
  return trainingNoteTagColors[offset % trainingNoteTagColors.length];
}

const trainingNoteTagColors: TrainingNoteTagColor[] = [
  "slate",
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "sky",
  "blue",
  "violet",
  "pink",
];

const trainingNoteTagClassNames: Record<TrainingNoteTagColor, string> = {
  amber:
    "border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  blue: "border-blue-500/35 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  green:
    "border-green-500/35 bg-green-500/10 text-green-700 dark:text-green-300",
  orange:
    "border-orange-500/35 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  pink: "border-pink-500/35 bg-pink-500/10 text-pink-700 dark:text-pink-300",
  red: "border-red-500/35 bg-red-500/10 text-red-700 dark:text-red-300",
  sky: "border-sky-500/35 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  slate:
    "border-slate-500/35 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  teal: "border-teal-500/35 bg-teal-500/10 text-teal-700 dark:text-teal-300",
  violet:
    "border-violet-500/35 bg-violet-500/10 text-violet-700 dark:text-violet-300",
};

const trainingNoteTagSwatchClassNames: Record<TrainingNoteTagColor, string> = {
  amber: "bg-amber-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
  red: "bg-red-500",
  sky: "bg-sky-500",
  slate: "bg-slate-500",
  teal: "bg-teal-500",
  violet: "bg-violet-500",
};

export {
  filterNotesByTags,
  formatCompactDate,
  formatNoteTimestamp,
  getTagsUsedByNotes,
  getTrainingNoteTagClassName,
  getTrainingNoteTagSwatchClassName,
  invalidateTrainingNoteQueries,
  nextTrainingNoteTagColor,
};
