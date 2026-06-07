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
} from "@/features/dashboard/components/dashboard-supplemental-cards";
import { RecentRunsTable } from "@/features/dashboard/components/recent-runs-table";
import { TrainingStreakSection } from "@/features/dashboard/components/training-streak-section";
import { WeeklyDistanceSection } from "@/features/dashboard/components/weekly-distance-section";
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
          message="Could not load dashboard data."
          variant="banner"
        />
      ) : null}
      <section className="relative min-h-[650px] overflow-hidden border-border/70 border-b px-0 py-8 sm:px-8 lg:min-h-[720px] lg:px-16">
        <div className="absolute top-5 right-5 z-20 sm:top-6 sm:right-6">
          <DashboardHeader
            isSyncing={incrementalSyncMutation.isPending}
            onSync={() => incrementalSyncMutation.mutate(undefined)}
          />
        </div>
        <img
          alt=""
          className="absolute inset-0 size-full origin-center -translate-x-[12%] scale-[1.16] object-cover object-[54%_center] opacity-80 brightness-125 contrast-90 saturate-110 sepia-[0.16] dark:opacity-75"
          src="/dashboard/hero_runner.png"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_54%_34%,color-mix(in_oklch,var(--primary)_12%,transparent)_0,transparent_18rem),linear-gradient(90deg,var(--background)_0%,color-mix(in_oklch,var(--background)_80%,transparent)_32%,color-mix(in_oklch,var(--background)_22%,transparent)_60%,color-mix(in_oklch,var(--background)_54%,transparent)_100%),linear-gradient(180deg,color-mix(in_oklch,var(--background)_70%,transparent)_0%,transparent_30%,var(--background)_100%)]" />
        <div className="relative min-h-[590px]">
          <div className="flex min-h-[590px] max-w-4xl flex-col justify-between gap-10 lg:max-w-[54%] xl:max-w-[58%]">
            <div>
              <p className="font-semibold text-primary text-xs uppercase">
                Weekly Briefing
              </p>
              <h1 className="mt-5 max-w-[560px] font-semibold font-serif text-5xl leading-[0.98] tracking-tight sm:text-6xl">
                Consistent progress, strong foundation.
              </h1>
              <p className="mt-6 max-w-md text-muted-foreground leading-7">
                You put in the work this week. Keep building aerobic base and
                managing fatigue.
              </p>
            </div>
            <DashboardMetrics
              isLoading={isSummaryLoading}
              thisWeek={thisWeek}
              weeklyDistance={weeklyDistance}
            />
          </div>
          <div className="relative z-10 mt-8 grid gap-5 lg:absolute lg:top-20 lg:right-0 lg:mt-0 lg:w-[320px] xl:w-[420px] 2xl:w-[500px]">
            <TrainingStreakSection />
            <WeeklyDistanceSection weeklyDistance={weeklyDistance} />
          </div>
        </div>
      </section>
      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.28fr)_minmax(390px,0.82fr)]">
        <main className="grid gap-5">
          <RecentRunsTable
            isLoading={recentActivities.isPending}
            runs={recentRuns}
          />
          <section className="grid gap-4 lg:grid-cols-2 xl:hidden">
            <RecoveryCard runs={recentRuns} />
            <TrainingGoalsDashboardCard />
          </section>
        </main>
        <aside className="grid min-w-0 content-start gap-5">
          <section className="hidden gap-4 xl:grid xl:grid-cols-1 2xl:grid-cols-2">
            <RecoveryCard runs={recentRuns} />
            <TrainingGoalsDashboardCard />
          </section>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <ShoeMileageCard weeklyDistance={weeklyDistance} />
            <TrainingNotesCard />
          </section>
        </aside>
      </div>
    </div>
  );
}
