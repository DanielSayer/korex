import type { TrainingNoteTag } from "@korex/api/modules/training-notes/training-notes.types";
import { Button } from "@korex/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@korex/ui/components/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArchiveIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RotateCcwIcon,
} from "lucide-react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";
import { TrainingNoteTagPreview } from "./training-note-tag-preview";
import { invalidateTrainingNoteTagQueries } from "./training-note-tags-cache";

function TrainingNoteTagRow({
  archived = false,
  onEdit,
  tag,
}: {
  archived?: boolean;
  onEdit?: () => void;
  tag: TrainingNoteTag;
}) {
  const queryClient = useQueryClient();
  const tagsQueryOptions = orpc.trainingNotes.tags.queryOptions();
  const archiveMutation = useMutation(
    orpc.trainingNotes.archiveTag.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: () => {
        invalidateTrainingNoteTagQueries(
          queryClient,
          tagsQueryOptions.queryKey,
        );
      },
    }),
  );
  const restoreMutation = useMutation(
    orpc.trainingNotes.restoreTag.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: () => {
        invalidateTrainingNoteTagQueries(
          queryClient,
          tagsQueryOptions.queryKey,
        );
      },
    }),
  );

  return (
    <div className="flex min-h-12 items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <TrainingNoteTagPreview
          archived={archived}
          color={tag.color}
          name={tag.name}
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label={`Actions for ${tag.name}`}
              size="icon-sm"
              type="button"
              variant="ghost"
            />
          }
        >
          <MoreHorizontalIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          {archived ? (
            <DropdownMenuItem
              disabled={restoreMutation.isPending}
              onClick={() => restoreMutation.mutate({ id: tag.id })}
            >
              <RotateCcwIcon className="size-4" />
              Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={onEdit}>
              <PencilIcon className="size-4" />
              Edit
            </DropdownMenuItem>
          )}
          {!archived ? (
            <DropdownMenuItem
              disabled={archiveMutation.isPending}
              onClick={() => archiveMutation.mutate({ id: tag.id })}
            >
              <ArchiveIcon className="size-4" />
              Archive
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { TrainingNoteTagRow };
