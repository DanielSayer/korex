import { useQuery } from "@tanstack/react-query";
import { MessageSquareTextIcon } from "lucide-react";
import { useState } from "react";
import { QueryRenderer } from "@/components/query-renderer";
import { orpc } from "@/utils/orpc";
import { TrainingNotesTimeline } from "./training-note-item";
import { TrainingNotesLoading } from "./training-note-loading";
import { TrainingNoteTagFilter } from "./training-note-tags";
import { filterNotesByTags, getTagsUsedByNotes } from "./training-note-utils";

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
              <TrainingNoteTagFilter
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

export { TrainingWeekActivityNotesSection };
