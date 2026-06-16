import type {
  DashboardThisWeek,
  DashboardWeeklyDistance,
  RecentActivity,
} from "@korex/api/modules/activities/activities.types";
import { ErrorMessage } from "@/components/error-message";
import { TrainingGoalsDashboardCard } from "@/features/training-goals/components/training-goals-dashboard-card";
import { DashboardHeader } from "./dashboard-header";
import { DashboardMetrics } from "./dashboard-metrics";
import {
  ShoeMileageCard,
  TrainingNotesCard,
} from "./dashboard-supplemental-cards";
import { RecentRunsTable } from "./recent-runs-table";
import { TrainingStreakSection } from "./training-streak-section";
import { WeeklyDistanceSection } from "./weekly-distance-section";
import { WeeklyFocusCard } from "./weekly-focus-card";

type DashboardDesktopProps = {
  hasError: boolean;
  isSummaryLoading: boolean;
  isSyncing: boolean;
  onSync: () => void;
  recentRuns: RecentActivity[];
  recentRunsLoading: boolean;
  thisWeek?: DashboardThisWeek;
  weeklyDistance?: DashboardWeeklyDistance;
};

function DashboardDesktop({
  hasError,
  isSummaryLoading,
  isSyncing,
  onSync,
  recentRuns,
  recentRunsLoading,
  thisWeek,
  weeklyDistance,
}: DashboardDesktopProps) {
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
          <DashboardHeader isSyncing={isSyncing} onSync={onSync} />
        </div>
        <div className="relative grid min-h-[clamp(620px,72svh,820px)] grid-cols-[repeat(auto-fit,minmax(min(100%,26rem),1fr))] items-end gap-8 px-6 pt-20 pb-8 sm:px-8 lg:px-10 xl:px-12">
          <div className="flex max-w-3xl flex-col justify-between gap-10 self-stretch">
            <div>
              <WeeklyFocusCard
                focus={thisWeek?.weeklyFocus}
                isLoading={isSummaryLoading}
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
          <RecentRunsTable isLoading={recentRunsLoading} runs={recentRuns} />
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

export { DashboardDesktop };
