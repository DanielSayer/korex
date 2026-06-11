import type { TrainingNoteTag } from "@korex/api/modules/training-notes/training-notes.types";
import { Button } from "@korex/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDownIcon, ChevronUpIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";
import { TrainingNoteTagRow } from "./training-note-tag-row";
import { TrainingNoteTagSheet } from "./training-note-tag-sheet";
import { invalidateTrainingNoteTagQueries } from "./training-note-tags-cache";

function TrainingNoteTagsEditor({ tags }: { tags: TrainingNoteTag[] }) {
  const queryClient = useQueryClient();
  const tagsQueryOptions = orpc.trainingNotes.tags.queryOptions();
  const activeTags = tags.filter((tag) => tag.archivedAt === null);
  const archivedTags = tags.filter((tag) => tag.archivedAt !== null);
  const [editingTag, setEditingTag] = useState<TrainingNoteTag | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showArchivedTags, setShowArchivedTags] = useState(false);
  const createMutation = useMutation(
    orpc.trainingNotes.createTag.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: () => {
        setIsCreating(false);
        invalidateTrainingNoteTagQueries(
          queryClient,
          tagsQueryOptions.queryKey,
        );
      },
    }),
  );
  const updateMutation = useMutation(
    orpc.trainingNotes.updateTag.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: () => {
        setEditingTag(null);
        invalidateTrainingNoteTagQueries(
          queryClient,
          tagsQueryOptions.queryKey,
        );
      },
    }),
  );

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex items-center justify-end">
        <Button onClick={() => setIsCreating(true)} type="button">
          <PlusIcon className="size-4" />
          New tag
        </Button>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 border-border/70 border-b pb-3">
          <div>
            <h3 className="font-semibold text-base">Active tags</h3>
            <p className="text-muted-foreground text-sm">
              {activeTags.length} available for new Training Notes.
            </p>
          </div>
        </div>
        {activeTags.length === 0 ? (
          <p className="border-border/70 border-y py-5 text-muted-foreground text-sm">
            No tags yet. Examples: fatigue, injury, sleep, gear.
          </p>
        ) : (
          <div className="divide-y">
            {activeTags.map((tag) => (
              <TrainingNoteTagRow
                key={tag.id}
                onEdit={() => setEditingTag(tag)}
                tag={tag}
              />
            ))}
          </div>
        )}
      </div>
      {archivedTags.length > 0 ? (
        <div className="space-y-3">
          <Button
            className="px-0 text-muted-foreground"
            onClick={() => setShowArchivedTags((current) => !current)}
            type="button"
            variant="ghost"
          >
            {showArchivedTags ? (
              <ChevronUpIcon className="size-4" />
            ) : (
              <ChevronDownIcon className="size-4" />
            )}
            {showArchivedTags ? "Hide archived" : "Show archived"} (
            {archivedTags.length})
          </Button>
          {showArchivedTags ? (
            <div className="divide-y border-border/70 border-y">
              {archivedTags.map((tag) => (
                <TrainingNoteTagRow archived key={tag.id} tag={tag} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      <TrainingNoteTagSheet
        isPending={createMutation.isPending}
        mode="create"
        onOpenChange={setIsCreating}
        onSubmit={({ color, name }) => createMutation.mutate({ color, name })}
        open={isCreating}
      />
      <TrainingNoteTagSheet
        isPending={updateMutation.isPending}
        mode="edit"
        onOpenChange={(open) => {
          if (!open) {
            setEditingTag(null);
          }
        }}
        onSubmit={({ color, name }) => {
          if (editingTag) {
            updateMutation.mutate({ color, id: editingTag.id, name });
          }
        }}
        open={editingTag !== null}
        tag={editingTag}
      />
    </div>
  );
}

export { TrainingNoteTagsEditor };
