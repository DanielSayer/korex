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
import { TrainingNotesTimeline } from "./training-note-item";
import {
  TrainingNoteTagFilter,
  TrainingNoteTagPicker,
} from "./training-note-tags";
import { TrainingNoteTextarea } from "./training-note-textarea";
import {
  filterNotesByTags,
  getTagsUsedByNotes,
  invalidateTrainingNoteQueries,
} from "./training-note-utils";

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
  const filteredNotes = filterNotesByTags(notes, filterTagIds);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
          <MessageSquareTextIcon className="size-4 text-primary" />
          <h2 className="font-medium">{title}</h2>
          {notes.length > 0 ? <span>{notes.length}</span> : null}
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          size="sm"
          type="button"
          variant="ghost"
        >
          <PlusIcon className="size-4" />
          Add
        </Button>
      </div>
      <div className="relative space-y-3 border-l pl-4">
        {notes.length === 0 && !isAdding ? (
          <p className="text-muted-foreground text-sm">
            No Training Notes yet.
          </p>
        ) : null}
        {isAdding ? (
          <div className="relative">
            <span className="absolute top-3 -left-5.25 size-2 rounded-full bg-primary" />
            <div className="rounded-md border bg-card p-3">
              <TrainingNoteTagPicker
                availableTags={availableTags}
                onChange={setDraftTagIds}
                selectedTagIds={draftTagIds}
              />
              <TrainingNoteTextarea
                onChange={setDraft}
                placeholder="Add detail..."
                value={draft}
              />
              <div className="mt-3 flex justify-end gap-2">
                <Button
                  onClick={() => {
                    setDraft("");
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
            selectedTagIds={filterTagIds}
            tags={filterTags}
          />
        ) : null}
        <TrainingNotesTimeline
          availableTags={availableTags}
          notes={filteredNotes}
          queryKey={queryKey}
        />
      </div>
    </div>
  );
}

export { TrainingNotesEditor };
