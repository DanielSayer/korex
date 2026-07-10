import type {
  TrainingNote,
  TrainingNoteTag,
} from "@korex/api/modules/training-notes/training-notes.types";

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

export { filterNotesByTags, getTagsUsedByNotes };
