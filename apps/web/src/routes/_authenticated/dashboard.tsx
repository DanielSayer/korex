import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { ErrorMessage } from "@/components/error-message";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardMetrics } from "@/features/dashboard/components/dashboard-metrics";
import {
  ShoeMileageCard,
  TrainingNotesCard,
} from "@/features/dashboard/components/dashboard-supplemental-cards";
import { RecentRunsTable } from "@/features/dashboard/components/recent-runs-table";
import { TrainingStreakSection } from "@/features/dashboard/components/training-streak-section";
import { WeeklyDistanceSection } from "@/features/dashboard/components/weekly-distance-section";
import { WeeklyFocusCard } from "@/features/dashboard/components/weekly-focus-card";
import { TrainingGoalsDashboardCard } from "@/features/training-goals/components/training-goals-dashboard-card";
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

  return (
    <div className="grid gap-5 p-0">
      {hasError ? (
        <ErrorMessage
          className="m-4 md:m-6"
          message="Could not load dashboard data."
          variant="banner"
        />
      ) : null}
      <section className="relative overflow-hidden border-border/70 border-b">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-svh overflow-hidden lg:inset-0 lg:h-auto"
        >
          <img
            alt=""
            className="size-full object-cover object-center opacity-80 brightness-125 contrast-90 saturate-110 sepia-[0.16] dark:opacity-75"
            src="/dashboard/hero_runner_wide_v2.png"
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_54%_34%,color-mix(in_oklch,var(--primary)_12%,transparent)_0,transparent_18rem),linear-gradient(90deg,var(--background)_0%,color-mix(in_oklch,var(--background)_80%,transparent)_32%,color-mix(in_oklch,var(--background)_22%,transparent)_60%,color-mix(in_oklch,var(--background)_54%,transparent)_100%),linear-gradient(180deg,color-mix(in_oklch,var(--background)_70%,transparent)_0%,transparent_30%,var(--background)_100%)]" />
        <div className="absolute top-4 right-4 z-20">
          <DashboardHeader
            isSyncing={incrementalSyncMutation.isPending}
            onSync={() => incrementalSyncMutation.mutate(undefined)}
          />
        </div>
        <div className="relative grid min-h-[clamp(620px,72svh,820px)] grid-cols-[repeat(auto-fit,minmax(min(100%,26rem),1fr))] items-end gap-8 px-6 pt-20 pb-8 sm:px-8 lg:px-10 xl:px-12">
          <div className="flex max-w-3xl flex-col justify-between gap-10 self-stretch">
            <div>
              <WeeklyFocusCard
                focus={thisWeek?.weeklyFocus}
                isLoading={dashboardThisWeek.isPending}
              />
            </div>
            <DashboardMetrics
              isLoading={isSummaryLoading}
              thisWeek={thisWeek}
              weeklyDistance={weeklyDistance}
            />
          </div>
          <div className="relative z-10 grid w-full max-w-110 gap-5 self-end justify-self-end">
            <TrainingStreakSection />
            <WeeklyDistanceSection weeklyDistance={weeklyDistance} />
          </div>
        </div>
      </section>
      <div className="grid min-w-0 items-start gap-5 px-4 md:px-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <main className="grid gap-5">
          <RecentRunsTable
            isLoading={recentActivities.isPending}
            runs={recentRuns}
          />
          <section className="grid gap-4 xl:hidden">
            <TrainingGoalsDashboardCard />
          </section>
        </main>
        <aside className="grid min-w-0 content-start gap-5">
          <section className="hidden gap-4 xl:grid">
            <TrainingGoalsDashboardCard />
          </section>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <ShoeMileageCard />
            <TrainingNotesCard />
          </section>
        </aside>
      </div>
    </div>
  );
}
