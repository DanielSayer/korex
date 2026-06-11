import { useQuery } from "@tanstack/react-query";
import { ErrorMessage } from "@/components/error-message";
import { QueryRenderer } from "@/components/query-renderer";
import { orpc } from "@/utils/orpc";
import { TrainingNoteTagsEditor } from "./training-note-tags-editor";

function TrainingNoteTagsSettings() {
  const tagsQueryOptions = orpc.trainingNotes.tags.queryOptions();
  const tagsQuery = useQuery(tagsQueryOptions);

  return (
    <section className="border-border/70 border-b pt-2 pb-10">
      <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <div>
          <h2 className="font-semibold text-xl tracking-tight">
            Training Note Tags
          </h2>
          <p className="mt-2 text-muted-foreground text-sm leading-6">
            Manage optional tags used to classify Training Notes.
          </p>
        </div>
        <QueryRenderer
          error={
            <ErrorMessage
              message="Could not load Training Note Tags."
              variant="banner"
            />
          }
          loading={<TrainingNoteTagsSettingsSkeleton />}
          query={tagsQuery}
        >
          {(tags) => <TrainingNoteTagsEditor tags={tags} />}
        </QueryRenderer>
      </div>
    </section>
  );
}

function TrainingNoteTagsSettingsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-24 animate-pulse rounded-md bg-muted" />
      <div className="h-16 animate-pulse rounded-md bg-muted" />
      <div className="h-16 animate-pulse rounded-md bg-muted" />
    </div>
  );
}

export { TrainingNoteTagsSettings };
