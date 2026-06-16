import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useIsMobileViewport } from "@/components/responsive";
import { orpc } from "@/utils/orpc";
import { DashboardDesktop } from "./dashboard-desktop";
import { DashboardMobile } from "./dashboard-mobile";

function DashboardPage() {
  const isMobileViewport = useIsMobileViewport();
  const queryClient = useQueryClient();
  const recentActivitiesQuery = orpc.activities.recent.queryOptions();
  const trainingStreakQuery = orpc.activities.trainingStreak.queryOptions();
  const trainingStreakCurrentWeekQuery =
    orpc.activities.trainingStreakCurrentWeek.queryOptions();
  const dashboardThisWeekQuery =
    orpc.activities.dashboardThisWeek.queryOptions();
  const trainingGoalProgressQuery =
    orpc.activities.trainingGoalProgress.queryOptions();
  const equipmentQuery = orpc.equipment.list.queryOptions();
  const [recentActivities, dashboardThisWeek] = useQueries({
    queries: [recentActivitiesQuery, dashboardThisWeekQuery],
  });
  const incrementalSyncMutation = useMutation(
    orpc.syncs.incremental.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: (result) => {
        toast.success(`${result.activitiesStored} activities synced`);
        for (const query of [
          recentActivitiesQuery,
          trainingStreakQuery,
          trainingStreakCurrentWeekQuery,
          dashboardThisWeekQuery,
          equipmentQuery,
          trainingGoalProgressQuery,
        ]) {
          queryClient.invalidateQueries({ queryKey: query.queryKey });
        }
      },
    }),
  );

  const recentRuns = recentActivities.data ?? [];
  const thisWeek = dashboardThisWeek.data;
  const weeklyDistance = thisWeek?.weeklyDistance;
  const hasError = recentActivities.isError || dashboardThisWeek.isError;
  const isSummaryLoading =
    recentActivities.isPending || dashboardThisWeek.isPending;
  const onSync = () => incrementalSyncMutation.mutate(undefined);
  const dashboardProps = {
    hasError,
    isSummaryLoading,
    isSyncing: incrementalSyncMutation.isPending,
    onSync,
    recentRuns,
    recentRunsLoading: recentActivities.isPending,
    thisWeek,
    weeklyDistance,
  };

  return isMobileViewport ? (
    <DashboardMobile {...dashboardProps} />
  ) : (
    <DashboardDesktop {...dashboardProps} />
  );
}

export { DashboardPage };
