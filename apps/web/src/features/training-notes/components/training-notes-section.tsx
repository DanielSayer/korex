import type { TrainingNote } from "@korex/api/modules/training-notes/training-notes.types";
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
            <div className="relative space-y-3 border-l pl-4">
              {notes.map((note) => (
                <TrainingNoteItem key={note.id} note={note} readOnly />
              ))}
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
  notes,
  queryKey,
  target,
  title,
}: {
  notes: TrainingNote[];
  queryKey: readonly unknown[];
  target: { activityId: number } | { weekStartAt: Date };
  title: string;
}) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const createMutation = useMutation(
    orpc.trainingNotes.create.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: () => {
        setDraft("");
        setIsAdding(false);
        invalidateTrainingNoteQueries(queryClient, queryKey);
      },
    }),
  );

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
              <TrainingNoteTextarea
                onChange={setDraft}
                placeholder="Add a short note..."
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
                    draft.trim().length === 0 || createMutation.isPending
                  }
                  onClick={() =>
                    createMutation.mutate({
                      ...target,
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
        {notes.map((note) => (
          <TrainingNoteItem key={note.id} note={note} queryKey={queryKey} />
        ))}
      </div>
    </div>
  );
}

function TrainingNoteItem({
  note,
  queryKey,
  readOnly = false,
}: {
  note: TrainingNote;
  queryKey?: readonly unknown[];
  readOnly?: boolean;
}) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(note.text);
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
          <TrainingNoteTextarea onChange={setDraft} value={draft} />
          <div className="mt-3 flex justify-end gap-2">
            <Button
              onClick={() => {
                setDraft(note.text);
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
              disabled={draft.trim().length === 0 || updateMutation.isPending}
              onClick={() =>
                updateMutation.mutate({
                  id: note.id,
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
          <p className="whitespace-pre-wrap leading-6">{note.text}</p>
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
      <p className="line-clamp-2 text-sm leading-5">{note.text}</p>
      <p className="mt-2 text-muted-foreground text-xs">
        {formatNoteTimestamp(note.createdAt)}
      </p>
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

export {
  RecentTrainingNotesCard,
  TrainingNotesSection,
  TrainingWeekActivityNotesSection,
};
