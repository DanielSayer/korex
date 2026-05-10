import { Button } from "@korex/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CloudSyncIcon } from "lucide-react";
import { toast } from "sonner";
import { LastFiveRunsSection } from "@/features/dashboard/components/last-five-runs-section";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const recentActivitiesQuery = orpc.activities.recent.queryOptions();
  const incrementalSyncMutation = useMutation(
    orpc.syncs.incremental.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: (result) => {
        toast.success(`${result.activitiesStored} activities synced`);
        queryClient.invalidateQueries({
          queryKey: recentActivitiesQuery.queryKey,
        });
      },
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Here's how your recent training is looking.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => incrementalSyncMutation.mutate(undefined)}
          loading={incrementalSyncMutation.isPending}
          loadingText="Syncing"
          className="w-full sm:w-auto"
        >
          <CloudSyncIcon className="size-4" />
          Sync now
        </Button>
      </div>
      <LastFiveRunsSection />
    </div>
  );
}
