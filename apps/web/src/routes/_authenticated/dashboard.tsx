import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { ErrorMessage } from "@/components/error-message";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardMetrics } from "@/features/dashboard/components/dashboard-metrics";
import {
  RecoveryCard,
  ShoeMileageCard,
  TrainingNotesCard,
  WeeklyTargetCard,
} from "@/features/dashboard/components/dashboard-supplemental-cards";
import { RecentRunsTable } from "@/features/dashboard/components/recent-runs-table";
import { TrainingStreakSection } from "@/features/dashboard/components/training-streak-section";
import { WeeklyDistanceSection } from "@/features/dashboard/components/weekly-distance-section";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const recentActivitiesQuery = orpc.activities.recent.queryOptions();
  const trainingStreakQuery = orpc.activities.trainingStreak.queryOptions();
  const trainingStreakCurrentWeekQuery =
    orpc.activities.trainingStreakCurrentWeek.queryOptions();
  const dashboardThisWeekQuery =
    orpc.activities.dashboardThisWeek.queryOptions();
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

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        isSyncing={incrementalSyncMutation.isPending}
        onSync={() => incrementalSyncMutation.mutate(undefined)}
      />
      {hasError ? (
        <ErrorMessage
          message="Could not load dashboard data."
          variant="banner"
        />
      ) : null}
      <DashboardMetrics
        isLoading={isSummaryLoading}
        thisWeek={thisWeek}
        weeklyDistance={weeklyDistance}
      />
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)]">
        <main className="grid gap-6">
          <RecentRunsTable
            isLoading={recentActivities.isPending}
            runs={recentRuns}
          />
          <section className="grid gap-4 lg:grid-cols-2">
            <RecoveryCard runs={recentRuns} />
            <WeeklyTargetCard weeklyDistance={weeklyDistance} />
          </section>
        </main>
        <aside className="grid min-w-0 content-start gap-5">
          <TrainingStreakSection />
          <WeeklyDistanceSection weeklyDistance={weeklyDistance} />
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <ShoeMileageCard weeklyDistance={weeklyDistance} />
            <TrainingNotesCard />
          </section>
        </aside>
      </div>
    </div>
  );
}
