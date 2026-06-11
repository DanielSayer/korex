import type { TrainingNoteTag } from "@korex/api/modules/training-notes/training-notes.types";
import { Button } from "@korex/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, CirclePlusIcon, SearchIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import {
  getTrainingNoteTagClassName,
  getTrainingNoteTagSwatchClassName,
  nextTrainingNoteTagColor,
} from "./training-note-utils";

function TrainingNoteTagPicker({
  availableTags,
  lockedTags = [],
  onChange,
  selectedTagIds,
}: {
  availableTags: TrainingNoteTag[];
  lockedTags?: TrainingNoteTag[];
  onChange: (tagIds: number[]) => void;
  selectedTagIds: number[];
}) {
  const queryClient = useQueryClient();
  const tagsQueryOptions = orpc.trainingNotes.tags.queryOptions();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedTagIdSet = new Set(selectedTagIds);
  const selectedLockedTags = lockedTags.filter((tag) =>
    selectedTagIdSet.has(tag.id),
  );
  const selectableTags = [...selectedLockedTags, ...availableTags];
  const selectedTags = selectableTags.filter((tag) =>
    selectedTagIdSet.has(tag.id),
  );
  const normalizedQuery = query.trim().toLowerCase();
  const filteredTags = useMemo(() => {
    if (!normalizedQuery) {
      return availableTags;
    }

    return availableTags.filter((tag) =>
      tag.name.toLowerCase().includes(normalizedQuery),
    );
  }, [availableTags, normalizedQuery]);
  const canCreateTag =
    normalizedQuery.length > 0 &&
    !selectableTags.some((tag) => tag.name.toLowerCase() === normalizedQuery);
  const createTagMutation = useMutation(
    orpc.trainingNotes.createTag.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: (tag) => {
        queryClient.setQueryData<TrainingNoteTag[]>(
          tagsQueryOptions.queryKey,
          (current) => (current ? [...current, tag] : [tag]),
        );
        onChange([...selectedTagIds, tag.id]);
        setQuery("");
        setIsOpen(false);
      },
    }),
  );

  if (availableTags.length === 0 && selectedLockedTags.length === 0) {
    return (
      <TrainingNoteTagSearchShell
        canCreateTag={canCreateTag}
        createTagMutationIsPending={createTagMutation.isPending}
        filteredTags={[]}
        isOpen={isOpen}
        onCreateTag={() =>
          createTagMutation.mutate({
            color: "slate",
            name: query,
          })
        }
        onOpenChange={setIsOpen}
        onQueryChange={setQuery}
        query={query}
        selectedTagIdSet={selectedTagIdSet}
        selectedTags={[]}
        toggleTag={() => undefined}
      />
    );
  }

  return (
    <TrainingNoteTagSearchShell
      canCreateTag={canCreateTag}
      createTagMutationIsPending={createTagMutation.isPending}
      filteredTags={filteredTags}
      isOpen={isOpen}
      onCreateTag={() =>
        createTagMutation.mutate({
          color: nextTrainingNoteTagColor(availableTags.length),
          name: query,
        })
      }
      onOpenChange={setIsOpen}
      onQueryChange={setQuery}
      query={query}
      selectedTagIdSet={selectedTagIdSet}
      selectedTags={selectedTags}
      toggleTag={(tag) => {
        if (selectedTagIdSet.has(tag.id)) {
          onChange(selectedTagIds.filter((tagId) => tagId !== tag.id));
        } else if (tag.archivedAt === null) {
          onChange([...selectedTagIds, tag.id]);
        }
        setQuery("");
      }}
    />
  );
}

function TrainingNoteTagSearchShell({
  canCreateTag,
  createTagMutationIsPending,
  filteredTags,
  isOpen,
  onCreateTag,
  onOpenChange,
  onQueryChange,
  query,
  selectedTagIdSet,
  selectedTags,
  toggleTag,
}: {
  canCreateTag: boolean;
  createTagMutationIsPending: boolean;
  filteredTags: TrainingNoteTag[];
  isOpen: boolean;
  onCreateTag: () => void;
  onOpenChange: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  query: string;
  selectedTagIdSet: Set<number>;
  selectedTags: TrainingNoteTag[];
  toggleTag: (tag: TrainingNoteTag) => void;
}) {
  return (
    <div className="relative mb-3">
      <div className="flex min-h-7 flex-wrap items-center gap-1.5">
        <span className="text-muted-foreground text-xs">Tags</span>
        {selectedTags.map((tag) => (
          <button
            className={cn(
              "inline-flex h-6 items-center gap-1 rounded-full border px-1.5 font-medium text-[11px]",
              getTrainingNoteTagClassName(tag.color),
              tag.archivedAt && "border-dashed opacity-80",
            )}
            key={tag.id}
            onClick={() => {
              if (tag.archivedAt === null) {
                toggleTag(tag);
              }
            }}
            type="button"
          >
            {tag.name}
            {tag.archivedAt === null ? <XIcon className="size-3" /> : null}
          </button>
        ))}
        <div className="inline-flex h-7 min-w-44 flex-1 items-center gap-1.5 rounded-full border bg-background px-2">
          <SearchIcon className="size-3.5 text-muted-foreground" />
          <input
            className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            onChange={(event) => {
              onQueryChange(event.target.value);
              onOpenChange(true);
            }}
            onFocus={() => onOpenChange(true)}
            placeholder="tag..."
            value={query}
          />
        </div>
      </div>
      {isOpen ? (
        <div className="absolute top-full left-0 z-20 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
          {filteredTags.slice(0, 6).map((tag) => {
            const selected = selectedTagIdSet.has(tag.id);

            return (
              <button
                className="flex h-8 w-full items-center justify-between gap-3 rounded-sm px-2 text-left text-xs hover:bg-muted"
                key={tag.id}
                onClick={() => toggleTag(tag)}
                type="button"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      getTrainingNoteTagSwatchClassName(tag.color),
                    )}
                  />
                  <span className="truncate">{tag.name}</span>
                </span>
                {selected ? (
                  <CheckIcon className="size-3 text-primary" />
                ) : null}
              </button>
            );
          })}
          {canCreateTag ? (
            <button
              className="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-primary text-xs hover:bg-muted"
              disabled={createTagMutationIsPending}
              onClick={onCreateTag}
              type="button"
            >
              <CirclePlusIcon className="size-3.5" />
              Create "{query.trim().toLowerCase()}"
            </button>
          ) : null}
          {filteredTags.length === 0 && !canCreateTag ? (
            <div className="px-2 py-1.5 text-muted-foreground text-xs">
              No matching tags.
            </div>
          ) : null}
          <button
            className="h-7 w-full rounded-sm px-2 text-left text-muted-foreground text-xs hover:bg-muted"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}

function TrainingNoteTagFilter({
  onChange,
  selectedTagIds,
  tags,
}: {
  onChange: (tagIds: number[]) => void;
  selectedTagIds: number[];
  tags: TrainingNoteTag[];
}) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b pb-3">
      <span className="text-muted-foreground text-xs">Filter</span>
      {tags.map((tag) => {
        const selected = selectedTagIds.includes(tag.id);

        return (
          <button
            className={cn(
              "rounded-full border px-2 py-1 font-medium text-xs",
              selected
                ? getTrainingNoteTagClassName(tag.color)
                : "bg-background text-muted-foreground hover:bg-muted",
            )}
            key={tag.id}
            onClick={() =>
              selected
                ? onChange(selectedTagIds.filter((tagId) => tagId !== tag.id))
                : onChange([...selectedTagIds, tag.id])
            }
            type="button"
          >
            {tag.name}
          </button>
        );
      })}
      {selectedTagIds.length > 0 ? (
        <Button
          className="h-7 px-2"
          onClick={() => onChange([])}
          size="sm"
          type="button"
          variant="ghost"
        >
          Clear
        </Button>
      ) : null}
    </div>
  );
}

function TrainingNoteTagList({
  className,
  tags,
}: {
  className?: string;
  tags: TrainingNoteTag[];
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag) => (
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 font-medium text-xs",
            getTrainingNoteTagClassName(tag.color),
            tag.archivedAt && "border-dashed opacity-80",
          )}
          key={tag.id}
        >
          {tag.name}
        </span>
      ))}
    </div>
  );
}

export { TrainingNoteTagFilter, TrainingNoteTagList, TrainingNoteTagPicker };
