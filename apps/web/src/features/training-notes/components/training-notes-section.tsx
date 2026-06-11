import { useQuery } from "@tanstack/react-query";
import { ErrorMessage } from "@/components/error-message";
import { QueryRenderer } from "@/components/query-renderer";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import { RecentTrainingNotesCard } from "./recent-training-notes-card";
import { TrainingNotesLoading } from "./training-note-loading";
import { TrainingNotesEditor } from "./training-notes-editor";
import { TrainingWeekActivityNotesSection } from "./training-week-activity-notes-section";

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

export {
  RecentTrainingNotesCard,
  TrainingNotesSection,
  TrainingWeekActivityNotesSection,
};
