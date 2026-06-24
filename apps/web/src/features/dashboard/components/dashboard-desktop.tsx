import type {
  CurrentTrainingWeekQualifyingActivities,
  DashboardThisWeek,
  DashboardWeeklyDistance,
  RecentActivity,
  TrainingStreak,
} from "@korex/api/modules/activities/activities.types";
import { SectionLabel } from "@/components/brand";
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
  currentWeek?: CurrentTrainingWeekQualifyingActivities;
  streak?: TrainingStreak | null;
  streakHasError: boolean;
  streakLoading: boolean;
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
  currentWeek,
  streak,
  streakHasError,
  streakLoading,
  thisWeek,
  weeklyDistance,
}: DashboardDesktopProps) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-8 lg:px-10 lg:py-10">
      <header className="flex items-end justify-between gap-6">
        <div>
          <p className="font-display text-4xl lowercase leading-none tracking-tight">
            Your trail
          </p>
          <p className="mt-2 text-muted-foreground text-sm">
            Read the week. Choose the next move.
          </p>
        </div>
        <DashboardHeader isSyncing={isSyncing} onSync={onSync} />
      </header>

      {hasError ? (
        <ErrorMessage
          message="Could not load dashboard data."
          variant="banner"
        />
      ) : null}

      <section className="rounded-3xl bg-primary/5 px-8 py-9 lg:px-10 lg:py-10">
        <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(24rem,0.65fr)]">
          <WeeklyFocusCard
            focus={thisWeek?.weeklyFocus}
            isLoading={isSummaryLoading}
          />
          <DashboardMetrics
            isLoading={isSummaryLoading}
            thisWeek={thisWeek}
            weeklyDistance={weeklyDistance}
          />
        </div>
      </section>

      <section className="grid gap-8 border-border/40 border-b pb-10 lg:grid-cols-2 lg:divide-x lg:divide-border/40">
        <div className="lg:pr-8">
          <TrainingStreakSection
            currentWeek={currentWeek}
            isError={streakHasError}
            isLoading={streakLoading}
            streak={streak}
          />
        </div>
        <div className="lg:pl-8">
          <WeeklyDistanceSection weeklyDistance={weeklyDistance} />
        </div>
      </section>

      <div className="grid min-w-0 items-start gap-10 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.55fr)]">
        <main className="min-w-0">
          <RecentRunsTable isLoading={recentRunsLoading} runs={recentRuns} />
        </main>
        <aside className="grid min-w-0 content-start gap-8 xl:border-border/40 xl:border-l xl:pl-10">
          <TrainingGoalsDashboardCard />
          <section className="grid gap-8 divide-y divide-border/40">
            <ShoeMileageCard />
            <TrainingNotesCard />
          </section>
        </aside>
      </div>
    </div>
  );
}

export { DashboardDesktop };
