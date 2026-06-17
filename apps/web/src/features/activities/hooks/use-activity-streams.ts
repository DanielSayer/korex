import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

function useActivityStreams(activityId: string | number) {
  return useQuery(
    orpc.activities.streams.queryOptions({
      input: { activityId },
    }),
  );
}

export { useActivityStreams };
