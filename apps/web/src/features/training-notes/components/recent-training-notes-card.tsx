import type { TrainingNote } from "@korex/api/modules/training-notes/training-notes.types";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { MessageSquareTextIcon } from "lucide-react";
import { QueryRenderer } from "@/components/query-renderer";
import { orpc } from "@/utils/orpc";
import { TrainingNoteTagList } from "./training-note-tags";
import { formatCompactDate, formatNoteTimestamp } from "./training-note-utils";

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

export { RecentTrainingNotesCard };
