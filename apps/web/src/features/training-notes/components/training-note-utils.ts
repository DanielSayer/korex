import type { QueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

function invalidateTrainingNoteQueries(
  queryClient: QueryClient,
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
  formatCompactDate,
  formatNoteTimestamp,
  invalidateTrainingNoteQueries,
};
