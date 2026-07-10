import type {
  TrainingNote,
  TrainingNoteTag,
} from "@korex/api/modules/training-notes/training-notes.types";
import { Button } from "@korex/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Edit3Icon, SaveIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";
import {
  TrainingNoteTagList,
  TrainingNoteTagPicker,
} from "./training-note-tags";
import { TrainingNoteTextarea } from "./training-note-textarea";
import {
  formatCompactDate,
  formatNoteTimestamp,
  invalidateTrainingNoteQueries,
} from "./training-note-utils";

function TrainingNotesTimeline({
  availableTags = [],
  notes,
  queryKey,
  readOnly = false,
}: {
  availableTags?: TrainingNoteTag[];
  notes: TrainingNote[];
  queryKey?: readonly unknown[];
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-3 md:space-y-0 md:border-border/40 md:border-t">
      {notes.map((note) => (
        <TrainingNoteItem
          availableTags={availableTags}
          key={note.id}
          note={note}
          queryKey={queryKey}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

function TrainingNoteItem({
  availableTags = [],
  note,
  queryKey,
  readOnly = false,
}: {
  availableTags?: TrainingNoteTag[];
  note: TrainingNote;
  queryKey?: readonly unknown[];
  readOnly?: boolean;
}) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(note.text);
  const [draftTagIds, setDraftTagIds] = useState(() =>
    note.tags.map((tag) => tag.id),
  );
  const updateMutation = useMutation(
    orpc.trainingNotes.update.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: () => {
        setIsEditing(false);
        if (queryKey) {
          invalidateTrainingNoteQueries(queryClient, queryKey);
        }
      },
    }),
  );
  const deleteMutation = useMutation(
    orpc.trainingNotes.delete.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: () => {
        if (queryKey) {
          invalidateTrainingNoteQueries(queryClient, queryKey);
        }
      },
    }),
  );

  return (
    <article className="group relative rounded-md bg-muted/30 px-3 py-2 text-sm md:rounded-none md:border-border/40 md:border-b md:bg-transparent md:px-0 md:py-5 md:last:border-b-0">
      <span className="absolute top-3 -left-[21px] size-2 rounded-full bg-primary md:top-6 md:bg-journal-route" />
      {note.targetType === "activity" && note.targetLabel ? (
        <Link
          className="mb-2 inline-flex max-w-full text-muted-foreground text-xs hover:text-primary"
          params={{ activityId: String(note.activityId) }}
          to="/activity/$activityId"
        >
          <span className="truncate">{note.targetLabel}</span>
          {note.targetStartAt ? (
            <span className="ml-2 shrink-0">
              {formatCompactDate(note.targetStartAt)}
            </span>
          ) : null}
        </Link>
      ) : null}
      {isEditing ? (
        <div>
          <TrainingNoteTagPicker
            availableTags={availableTags}
            assignedArchivedTags={note.tags.filter(
              (tag) => tag.archivedAt !== null,
            )}
            onChange={setDraftTagIds}
            selectedTagIds={draftTagIds}
          />
          <TrainingNoteTextarea
            focusOnMount
            onChange={setDraft}
            value={draft}
          />
          <div className="mt-3 flex justify-end gap-2">
            <Button
              onClick={() => {
                setDraft(note.text);
                setDraftTagIds(note.tags.map((tag) => tag.id));
                setIsEditing(false);
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              <XIcon className="size-4" />
              Cancel
            </Button>
            <Button
              disabled={
                (draft.trim().length === 0 && draftTagIds.length === 0) ||
                updateMutation.isPending
              }
              onClick={() =>
                updateMutation.mutate({
                  id: note.id,
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
      ) : (
        <>
          {note.tags.length > 0 ? (
            <TrainingNoteTagList tags={note.tags} />
          ) : null}
          {note.text ? (
            <p className="mt-2 whitespace-pre-wrap leading-6 first:mt-0">
              {note.text}
            </p>
          ) : null}
          <div className="mt-3 flex min-w-0 items-center justify-between gap-3">
            <span className="text-muted-foreground text-xs">
              {formatNoteTimestamp(note.createdAt)}
            </span>
            {readOnly ? null : (
              <div className="flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                <Button
                  aria-label="Edit Training Note"
                  onClick={() => setIsEditing(true)}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <Edit3Icon className="size-4" />
                </Button>
                <Button
                  aria-label="Delete Training Note"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (window.confirm("Delete this Training Note?")) {
                      deleteMutation.mutate({ id: note.id });
                    }
                  }}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </article>
  );
}

export { TrainingNotesTimeline };
