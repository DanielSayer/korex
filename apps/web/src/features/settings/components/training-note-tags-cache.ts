import type { QueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

function invalidateTrainingNoteTagQueries(
  queryClient: QueryClient,
  tagsQueryKey: readonly unknown[],
) {
  queryClient.invalidateQueries({ queryKey: tagsQueryKey });
  queryClient.invalidateQueries({
    queryKey: orpc.trainingNotes.recent.queryOptions().queryKey,
  });
}

export { invalidateTrainingNoteTagQueries };
