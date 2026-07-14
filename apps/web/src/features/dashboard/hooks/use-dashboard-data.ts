import type {
  CurrentTrainingWeekQualifyingActivities,
  DashboardThisWeek,
  DashboardWeeklyDistance,
  RecentActivity,
  TrainingStreak,
} from "@korex/api/modules/activities/activities.types";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";

type DashboardData = {
  currentWeek?: CurrentTrainingWeekQualifyingActivities;
  hasError: boolean;
  isSummaryLoading: boolean;
  isSyncing: boolean;
  onSync: () => void;
  recentRuns: RecentActivity[];
  recentRunsLoading: boolean;
  streak?: TrainingStreak | null;
  streakHasError: boolean;
  streakLoading: boolean;
  thisWeek?: DashboardThisWeek;
  weeklyDistance?: DashboardWeeklyDistance;
};

function useDashboardData(): DashboardData {
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
  const [recentActivities, dashboardThisWeek, trainingStreak, currentWeek] =
    useQueries({
      queries: [
        recentActivitiesQuery,
        dashboardThisWeekQuery,
        trainingStreakQuery,
        trainingStreakCurrentWeekQuery,
      ],
    });
  const incrementalSyncMutation = useMutation(
    orpc.syncs.incremental.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: () => {
        toast.success("Activity sync queued");
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

  const thisWeek = dashboardThisWeek.data;

  return {
    currentWeek: currentWeek.data,
    hasError: recentActivities.isError || dashboardThisWeek.isError,
    isSummaryLoading: recentActivities.isPending || dashboardThisWeek.isPending,
    isSyncing: incrementalSyncMutation.isPending,
    onSync: () => incrementalSyncMutation.mutate(undefined),
    recentRuns: recentActivities.data ?? [],
    recentRunsLoading: recentActivities.isPending,
    streak: trainingStreak.data,
    streakHasError: trainingStreak.isError || currentWeek.isError,
    streakLoading: trainingStreak.isPending || currentWeek.isPending,
    thisWeek,
    weeklyDistance: thisWeek?.weeklyDistance,
  };
}

export type { DashboardData };
export { useDashboardData };
