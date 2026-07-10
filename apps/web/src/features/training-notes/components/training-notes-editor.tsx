import type {
  TrainingNote,
  TrainingNoteTag,
} from "@korex/api/modules/training-notes/training-notes.types";
import { Button } from "@korex/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquareTextIcon, PlusIcon, SaveIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";
import {
  filterNotesByTags,
  getTagsUsedByNotes,
} from "./training-note-filter-utils";
import { TrainingNotesTimeline } from "./training-note-item";
import {
  TrainingNoteTagFilter,
  TrainingNoteTagPicker,
} from "./training-note-tags";
import { TrainingNoteTextarea } from "./training-note-textarea";
import { invalidateTrainingNoteQueries } from "./training-note-utils";

function TrainingNotesEditor({
  availableTags,
  notes,
  queryKey,
  target,
  title,
}: {
  availableTags: TrainingNoteTag[];
  notes: TrainingNote[];
  queryKey: readonly unknown[];
  target: { activityId: number } | { weekStartAt: Date };
  title: string;
}) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftTagIds, setDraftTagIds] = useState<number[]>([]);
  const [filterTagIds, setFilterTagIds] = useState<number[]>([]);
  const createMutation = useMutation(
    orpc.trainingNotes.create.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: () => {
        setDraft("");
        setDraftTagIds([]);
        setIsAdding(false);
        invalidateTrainingNoteQueries(queryClient, queryKey);
      },
    }),
  );
  const filterTags = getTagsUsedByNotes(notes);
  const visibleFilterTagIds = filterTagIds.filter((tagId) =>
    filterTags.some((tag) => tag.id === tagId),
  );
  const filteredNotes = filterNotesByTags(notes, visibleFilterTagIds);

  return (
    <div className="min-w-0 space-y-3 md:space-y-4">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
          <MessageSquareTextIcon className="size-4 text-primary md:text-journal-route" />
          <h2 className="font-medium md:font-display md:text-[11px] md:uppercase md:tracking-[0.18em]">
            {title}
          </h2>
          {notes.length > 0 ? (
            <span>
              {notes.length}
              <span className="sr-only"> Training Notes</span>
            </span>
          ) : null}
        </div>
        <Button
          disabled={isAdding}
          onClick={() => setIsAdding(true)}
          size="sm"
          type="button"
          variant="ghost"
        >
          <PlusIcon className="size-4" />
          Add
        </Button>
      </div>
      <div className="relative space-y-3 border-l pl-4 md:space-y-0 md:border-l-0 md:pl-0">
        {notes.length === 0 && !isAdding ? (
          <p className="text-muted-foreground text-sm md:border-border/40 md:border-t md:py-6">
            No Training Notes yet.
            <span className="hidden md:inline">
              {" "}
              Add the first observation for this training context.
            </span>
          </p>
        ) : null}
        {isAdding ? (
          <div className="relative">
            <span className="absolute top-3 -left-5.25 size-2 rounded-full bg-primary md:hidden" />
            <div className="rounded-md border bg-card p-3 md:rounded-none md:border-border/40 md:border-x-0 md:bg-transparent md:px-0 md:py-5">
              <TrainingNoteTagPicker
                availableTags={availableTags}
                onChange={setDraftTagIds}
                selectedTagIds={draftTagIds}
              />
              <TrainingNoteTextarea
                focusOnMount
                onChange={setDraft}
                placeholder="Add detail..."
                value={draft}
              />
              <div className="mt-3 flex justify-end gap-2">
                <Button
                  onClick={() => {
                    setDraft("");
                    setDraftTagIds([]);
                    setIsAdding(false);
                  }}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <XIcon className="size-4" />
                  Cancel
                </Button>
                <Button
                  disabled={
                    (draft.trim().length === 0 && draftTagIds.length === 0) ||
                    createMutation.isPending
                  }
                  onClick={() =>
                    createMutation.mutate({
                      ...target,
                      tagIds: draftTagIds,
                      text: draft,
                    })
                  }
                  size="sm"
                  type="button"
                >
                  <SaveIcon className="size-4" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        ) : null}
        {filterTags.length > 0 ? (
          <TrainingNoteTagFilter
            onChange={setFilterTagIds}
            selectedTagIds={visibleFilterTagIds}
            tags={filterTags}
          />
        ) : null}
        {notes.length > 0 && filteredNotes.length === 0 ? (
          <p className="py-5 text-muted-foreground text-sm">
            No Training Notes match these tags.
          </p>
        ) : null}
        {filteredNotes.length > 0 ? (
          <TrainingNotesTimeline
            availableTags={availableTags}
            notes={filteredNotes}
            queryKey={queryKey}
          />
        ) : null}
      </div>
    </div>
  );
}

export { TrainingNotesEditor };
