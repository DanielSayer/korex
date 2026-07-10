import { useQuery } from "@tanstack/react-query";
import { MessageSquareTextIcon } from "lucide-react";
import { useState } from "react";
import { ErrorMessage } from "@/components/error-message";
import { QueryRenderer } from "@/components/query-renderer";
import { orpc } from "@/utils/orpc";
import {
  filterNotesByTags,
  getTagsUsedByNotes,
} from "./training-note-filter-utils";
import { TrainingNotesTimeline } from "./training-note-item";
import { TrainingNotesLoading } from "./training-note-loading";
import { TrainingNoteTagFilter } from "./training-note-tags";

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
    <section className="min-w-0 space-y-3 md:space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <MessageSquareTextIcon className="size-4 text-primary md:text-journal-route" />
        <h2 className="font-medium md:font-display md:text-[11px] md:uppercase md:tracking-[0.18em]">
          Activity Notes This Week
        </h2>
      </div>
      <QueryRenderer
        error={
          <div className="rounded-md border p-3 md:rounded-none md:border-border/40 md:border-x-0 md:px-0">
            <ErrorMessage
              message="Could not load Activity Training Notes for this week."
              variant="banner"
            />
          </div>
        }
        loading={<TrainingNotesLoading />}
        query={notesQuery}
      >
        {(notes) => {
          if (notes.length === 0) {
            return (
              <p className="text-muted-foreground text-sm md:border-border/40 md:border-t md:py-6">
                No Activity notes for this Training Week.
              </p>
            );
          }

          const filterTags = getTagsUsedByNotes(notes);
          const visibleFilterTagIds = filterTagIds.filter((tagId) =>
            filterTags.some((tag) => tag.id === tagId),
          );
          const filteredNotes = filterNotesByTags(notes, visibleFilterTagIds);

          return (
            <div className="space-y-3 md:space-y-0">
              <TrainingNoteTagFilter
                onChange={setFilterTagIds}
                selectedTagIds={visibleFilterTagIds}
                tags={filterTags}
              />
              {filteredNotes.length === 0 ? (
                <p className="py-5 text-muted-foreground text-sm">
                  No Activity Training Notes match these tags.
                </p>
              ) : null}
              {filteredNotes.length > 0 ? (
                <div className="relative space-y-3 border-l pl-4 md:space-y-0 md:border-l-0 md:pl-0">
                  <TrainingNotesTimeline notes={filteredNotes} readOnly />
                </div>
              ) : null}
            </div>
          );
        }}
      </QueryRenderer>
    </section>
  );
}

export { TrainingWeekActivityNotesSection };
