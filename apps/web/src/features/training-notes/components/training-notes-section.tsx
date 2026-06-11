import type {
  TrainingNote,
  TrainingNoteTag,
  TrainingNoteTagColor,
} from "@korex/api/modules/training-notes/training-notes.types";
import { Button } from "@korex/ui/components/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Edit3Icon,
  MessageSquareTextIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ErrorMessage } from "@/components/error-message";
import { QueryRenderer } from "@/components/query-renderer";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

type TrainingNotesSectionProps =
  | {
      activityId: number;
      className?: string;
      title?: string;
      type: "activity";
    }
  | {
      className?: string;
      title?: string;
      type: "trainingWeek";
      weekStartAt: Date;
    };

function TrainingNotesSection(props: TrainingNotesSectionProps) {
  const queryOptions =
    props.type === "activity"
      ? orpc.trainingNotes.listForActivity.queryOptions({
          input: { activityId: props.activityId },
        })
      : orpc.trainingNotes.listForTrainingWeek.queryOptions({
          input: { weekStartAt: props.weekStartAt },
        });
  const notesQuery = useQuery(queryOptions);
  const tagsQuery = useQuery(orpc.trainingNotes.tags.queryOptions());

  return (
    <section className={cn("space-y-3", props.className)}>
      <QueryRenderer
        error={
          <div className="rounded-md border p-3">
            <ErrorMessage
              message="Could not load Training Notes."
              variant="banner"
            />
          </div>
        }
        loading={<TrainingNotesLoading />}
        query={notesQuery}
      >
        {(notes) => (
          <TrainingNotesEditor
            availableTags={(tagsQuery.data ?? []).filter(
              (tag) => tag.archivedAt === null,
            )}
            notes={notes}
            queryKey={queryOptions.queryKey}
            target={
              props.type === "activity"
                ? { activityId: props.activityId }
                : { weekStartAt: props.weekStartAt }
            }
            title={props.title ?? "Training Notes"}
          />
        )}
      </QueryRenderer>
    </section>
  );
}

function TrainingWeekActivityNotesSection({
  weekStartAt,
}: {
  weekStartAt: Date;
}) {
  const queryOptions =
    orpc.trainingNotes.activityNotesForTrainingWeek.queryOptions({
      input: { weekStartAt },
    });
  const notesQuery = useQuery(queryOptions);
  const [filterTagIds, setFilterTagIds] = useState<number[]>([]);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <MessageSquareTextIcon className="size-4 text-primary" />
        <h2 className="font-medium">Activity Notes This Week</h2>
      </div>
      <QueryRenderer
        error={null}
        loading={<TrainingNotesLoading />}
        query={notesQuery}
      >
        {(notes) =>
          notes.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No Activity notes for this Training Week.
            </p>
          ) : (
            <div className="space-y-3">
              <TrainingNoteFilter
                onChange={setFilterTagIds}
                selectedTagIds={filterTagIds}
                tags={getTagsUsedByNotes(notes)}
              />
              <div className="relative space-y-3 border-l pl-4">
                <TrainingNotesTimeline
                  notes={filterNotesByTags(notes, filterTagIds)}
                  readOnly
                />
              </div>
            </div>
          )
        }
      </QueryRenderer>
    </section>
  );
}

function RecentTrainingNotesCard() {
  const notesQuery = useQuery(orpc.trainingNotes.recent.queryOptions());

  return (
    <section className="rounded-xl border border-border/55 bg-card/40 p-5 shadow-black/5 shadow-md backdrop-blur-sm dark:bg-card/35 dark:shadow-black/15">
      <div className="flex items-start gap-3">
        <MessageSquareTextIcon className="mt-1 size-5 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold font-serif text-sm uppercase">
            Training notes
          </h2>
          <QueryRenderer
            error={
              <p className="mt-4 text-muted-foreground text-sm">
                Could not load recent notes.
              </p>
            }
            loading={
              <div className="mt-4 space-y-3">
                <div className="h-12 animate-pulse rounded-md bg-muted" />
                <div className="h-12 animate-pulse rounded-md bg-muted" />
              </div>
            }
            query={notesQuery}
          >
            {(notes) =>
              notes.length === 0 ? (
                <p className="mt-4 text-muted-foreground text-sm leading-6">
                  Recent Training Notes will appear here after you add them from
                  an Activity or Training Week.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {notes.slice(0, 3).map((note) => (
                    <RecentTrainingNoteItem key={note.id} note={note} />
                  ))}
                </div>
              )
            }
          </QueryRenderer>
        </div>
      </div>
    </section>
  );
}

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
          <TrainingNoteFilter
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
    <>
      {notes.map((note) => (
        <TrainingNoteItem
          availableTags={availableTags}
          key={note.id}
          note={note}
          queryKey={queryKey}
          readOnly={readOnly}
        />
      ))}
    </>
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
    <article className="group relative rounded-md bg-muted/30 px-3 py-2 text-sm">
      <span className="absolute top-3 -left-[21px] size-2 rounded-full bg-primary" />
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
            lockedTags={note.tags.filter((tag) => tag.archivedAt !== null)}
            onChange={setDraftTagIds}
            selectedTagIds={draftTagIds}
          />
          <TrainingNoteTextarea onChange={setDraft} value={draft} />
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
          <div className="mt-3 flex items-center justify-between gap-3">
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

function RecentTrainingNoteItem({ note }: { note: TrainingNote }) {
  const target =
    note.targetType === "activity" && note.activityId ? (
      <Link
        className="font-medium text-primary hover:underline"
        params={{ activityId: String(note.activityId) }}
        to="/activity/$activityId"
      >
        {note.targetLabel ?? "Activity"}
      </Link>
    ) : (
      <span className="font-medium text-primary">
        Week of {formatCompactDate(note.weekStartAt)}
      </span>
    );

  return (
    <div className="rounded-md border border-border/70 bg-muted/20 p-3">
      <div className="mb-1 text-xs">{target}</div>
      {note.tags.length > 0 ? (
        <TrainingNoteTagList className="mb-2" tags={note.tags} />
      ) : null}
      {note.text ? (
        <p className="line-clamp-2 text-sm leading-5">{note.text}</p>
      ) : null}
      <p className="mt-2 text-muted-foreground text-xs">
        {formatNoteTimestamp(note.createdAt)}
      </p>
    </div>
  );
}

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
  const selectedTagIdSet = new Set(selectedTagIds);
  const selectedLockedTags = lockedTags.filter((tag) =>
    selectedTagIdSet.has(tag.id),
  );

  if (availableTags.length === 0 && selectedLockedTags.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {[...selectedLockedTags, ...availableTags].map((tag) => {
        const selected = selectedTagIdSet.has(tag.id);
        const archived = tag.archivedAt !== null;

        return (
          <button
            className={cn(
              "rounded-full border px-2 py-1 font-medium text-xs transition-colors",
              selected
                ? getTrainingNoteTagClassName(tag.color)
                : "bg-background text-muted-foreground hover:bg-muted",
              archived && "border-dashed opacity-80",
            )}
            key={tag.id}
            onClick={() => {
              if (selected) {
                onChange(selectedTagIds.filter((tagId) => tagId !== tag.id));
              } else if (!archived) {
                onChange([...selectedTagIds, tag.id]);
              }
            }}
            type="button"
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}

function TrainingNoteFilter({
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

function TrainingNoteTextarea({
  onChange,
  placeholder,
  value,
}: {
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <textarea
      className="min-h-20 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
      maxLength={2000}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      value={value}
    />
  );
}

function TrainingNotesLoading() {
  return (
    <div className="space-y-3">
      <div className="h-16 animate-pulse rounded-md bg-muted" />
      <div className="h-16 animate-pulse rounded-md bg-muted" />
    </div>
  );
}

function invalidateTrainingNoteQueries(
  queryClient: ReturnType<typeof useQueryClient>,
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

export {
  RecentTrainingNotesCard,
  TrainingNotesSection,
  TrainingWeekActivityNotesSection,
};
