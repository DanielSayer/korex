import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterNotesByTags,
  getTagsUsedByNotes,
} from "./training-note-filter-utils.ts";

const activeTag = tag(1, "Effort");
const archivedTag = tag(2, "Archived", "2026-01-01T00:00:00.000Z");
const recoveryTag = tag(3, "Recovery");
const notes = [
  note(1, [activeTag]),
  note(2, [archivedTag, recoveryTag]),
  note(3, []),
];

describe("Training Note tag filtering", () => {
  it("returns every note when no filters are selected", () => {
    assert.equal(filterNotesByTags(notes, []), notes);
  });

  it("matches any selected tag", () => {
    assert.deepEqual(
      filterNotesByTags(notes, [activeTag.id, recoveryTag.id]).map(
        (item) => item.id,
      ),
      [1, 2],
    );
  });

  it("includes assigned archived tags in alphabetical filter options", () => {
    assert.deepEqual(
      getTagsUsedByNotes(notes).map((item) => [item.name, item.archivedAt]),
      [
        ["Archived", archivedTag.archivedAt],
        ["Effort", null],
        ["Recovery", null],
      ],
    );
  });
});

function note(id, tags) {
  return { id, tags };
}

function tag(id, name, archivedAt = null) {
  return { archivedAt, id, name };
}
