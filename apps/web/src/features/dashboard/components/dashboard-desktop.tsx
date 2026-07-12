import type {
  DashboardThisWeek,
  DashboardWeeklyDistance,
  DashboardWeeklyFocus,
} from "@korex/api/modules/activities/activities.types";
import { Button } from "@korex/ui/components/button";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRightIcon,
  ChevronRightIcon,
  FootprintsIcon,
  UserRoundIcon,
} from "lucide-react";
import { SectionLabel } from "@/components/brand";
import { ErrorMessage } from "@/components/error-message";
import { TrainingGoalsDashboardCard } from "@/features/training-goals/components/training-goals-dashboard-card";
import { authClient } from "@/lib/auth-client";
import {
  formatDistance,
  formatDistanceValue,
  formatDurationCompact,
  formatPaceSeconds,
} from "@/utils/formatters";
import type { DashboardData } from "../hooks/use-dashboard-data";
import { DashboardHeader } from "./dashboard-header";
import {
  ShoeMileageCard,
  TrainingNotesCard,
} from "./dashboard-supplemental-cards";
import { RecentRunsTable } from "./recent-runs-table";
import { TrainingStreakSection } from "./training-streak-section";
import { WeeklyDistanceSection } from "./weekly-distance-section";

function DashboardDesktop({
  currentWeek,
  hasError,
  isSummaryLoading,
  isSyncing,
  onSync,
  recentRuns,
  recentRunsLoading,
  streak,
  streakHasError,
  streakLoading,
  thisWeek,
  weeklyDistance,
}: DashboardData) {
  const session = authClient.useSession();
  const name = session.data?.user.name?.trim() || "Runner";
  const firstName = name.split(/\s+/)[0] || "Runner";

  return (
    <div className="mx-auto w-full max-w-[96rem] px-6 py-7 lg:px-10 lg:py-9">
      <JournalHeader
        firstName={firstName}
        isSyncing={isSyncing}
        onSync={onSync}
      />

      {hasError ? (
        <ErrorMessage
          className="mt-6"
          message="Some live dashboard data could not be loaded."
          variant="banner"
        />
      ) : null}

      <div className="mt-10 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
        <WeeklyLead
          isLoading={isSummaryLoading}
          thisWeek={thisWeek}
          weeklyDistance={weeklyDistance}
        />
        <PlannedSession />
      </div>

      <section className="mt-8 grid gap-8 border-border border-y py-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(21rem,0.65fr)] xl:divide-x xl:divide-border">
        <div className="min-w-0 xl:pr-8">
          <WeeklyDistanceSection weeklyDistance={weeklyDistance} />
        </div>
        <div className="xl:pl-8">
          <TrainingStreakSection
            currentWeek={currentWeek}
            isError={streakHasError}
            isLoading={streakLoading}
            streak={streak}
          />
        </div>
      </section>

      <div className="mt-8 grid min-w-0 items-start gap-10 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.6fr)]">
        <div className="min-w-0">
          <RecentRunsTable isLoading={recentRunsLoading} runs={recentRuns} />
        </div>
        <aside className="grid min-w-0 content-start gap-8 xl:border-border xl:border-l xl:pl-10">
          <TrainingGoalsDashboardCard />
          <section className="grid gap-8 divide-y divide-border">
            <ShoeMileageCard />
            <TrainingNotesCard />
          </section>
        </aside>
      </div>
    </div>
  );
}

function JournalHeader({
  firstName,
  isSyncing,
  onSync,
}: {
  firstName: string;
  isSyncing: boolean;
  onSync: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-6">
      <div>
        <SectionLabel>{formatDashboardDate()}</SectionLabel>
        <h1 className="mt-2 font-display font-medium text-4xl leading-none tracking-tight lg:text-[2.625rem]">
          {getGreeting()}, {firstName}.
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <DashboardHeader isSyncing={isSyncing} onSync={onSync} />
        <Button
          className="rounded-full"
          nativeButton={false}
          render={<Link to="/settings/profile" />}
          variant="outline"
        >
          <UserRoundIcon aria-hidden="true" className="size-4" />
          Athlete profile
        </Button>
      </div>
    </header>
  );
}

function WeeklyLead({
  isLoading,
  thisWeek,
  weeklyDistance,
}: {
  isLoading: boolean;
  thisWeek?: DashboardThisWeek;
  weeklyDistance?: DashboardWeeklyDistance;
}) {
  const focus = thisWeek?.weeklyFocus;
  const distanceMeters =
    thisWeek?.distanceMeters ?? weeklyDistance?.thisWeekDistanceMeters ?? null;
  const distanceProgress = getDistanceProgress(weeklyDistance);

  return (
    <section className="relative min-h-[22rem] overflow-hidden rounded-4xl bg-journal-hero px-8 py-7 text-journal-hero-foreground lg:px-10 lg:py-9">
      <RouteTexture />
      <div className="relative z-10 max-w-4xl">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="font-display text-[10px] text-journal-route uppercase tracking-[0.2em]">
              This week · live
            </p>
            <h2 className="mt-4 max-w-2xl font-display text-2xl leading-tight">
              {isLoading
                ? "Reading the week…"
                : (focus?.title ?? "Start with the next Activity.")}
            </h2>
            <FocusBody focus={focus} isLoading={isLoading} />
          </div>
          <span className="shrink-0 rounded-full border border-current/20 bg-current/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em]">
            {isLoading ? "Loading" : formatFocusStatus(focus)}
          </span>
        </div>

        <div className="mt-12 flex items-end gap-3">
          <span className="font-display font-medium text-8xl tabular-nums leading-[0.72] tracking-tighter lg:text-9xl">
            {isLoading ? "--" : formatDistanceValue(distanceMeters)}
          </span>
          <span className="text-lg opacity-70">km</span>
        </div>

        <div className="mt-8 max-w-3xl">
          <div className="flex items-center justify-between gap-4 text-[10px] uppercase tracking-[0.16em]">
            <span className="opacity-70">Weekly distance</span>
            <span>
              {weeklyDistance
                ? `${formatDistance(weeklyDistance.averageWeeklyDistanceMeters)} recent weekly average`
                : "Recent weekly average unavailable"}
            </span>
          </div>
          <div
            aria-label="Progress against recent weekly average"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={distanceProgress}
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-current/15"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-journal-route"
              style={{ width: `${distanceProgress}%` }}
            />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-6 border-current/15 border-t pt-5">
            <LeadMetric
              label="Moving time"
              value={
                isLoading || !thisWeek
                  ? "--"
                  : formatDurationCompact(thisWeek.durationSeconds)
              }
            />
            <LeadMetric
              label="Average pace"
              value={
                isLoading || !thisWeek?.averagePaceSecondsPerKilometer
                  ? "--"
                  : `${formatPaceSeconds(
                      thisWeek.averagePaceSecondsPerKilometer,
                    )} /km`
              }
            />
            <LeadMetric
              label="Activities"
              value={
                isLoading || !thisWeek ? "--" : String(thisWeek.activityCount)
              }
            />
          </div>
        </div>
      </div>
      <RouteSketch />
    </section>
  );
}

function PlannedSession() {
  return (
    <section
      aria-label="Planned session concept"
      className="flex min-h-[22rem] flex-col overflow-hidden rounded-4xl bg-journal-plan px-7 py-7 text-journal-plan-foreground lg:px-8 lg:py-8"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="font-display text-[10px] uppercase tracking-[0.2em]">
          Next on the trail
        </p>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-current/15 px-2.5 py-1 text-[9px] uppercase tracking-[0.12em]">
            Concept
          </span>
          <ArrowUpRightIcon aria-hidden="true" className="size-4" />
        </div>
      </div>

      <div className="mt-10 grid size-16 place-items-center rounded-full border border-current/15">
        <FootprintsIcon aria-hidden="true" className="size-7" />
      </div>

      <div className="mt-6">
        <p className="font-display text-[10px] uppercase tracking-[0.18em]">
          Tomorrow · 6:00 AM
        </p>
        <h2 className="mt-2 font-display text-3xl leading-none tracking-tight">
          Long aerobic run
        </h2>
      </div>

      <div className="mt-auto flex items-end justify-between gap-4 border-current/15 border-t pt-6">
        <div>
          <p className="font-display text-2xl tabular-nums tracking-tight">
            14 km
          </p>
          <p className="mt-1 text-xs opacity-70">6:05–6:25 /km</p>
        </div>
        <span
          aria-hidden="true"
          className="grid size-11 place-items-center rounded-full bg-journal-plan-foreground text-journal-plan"
        >
          <ChevronRightIcon className="size-5" />
        </span>
      </div>
    </section>
  );
}

function FocusBody({
  focus,
  isLoading,
}: {
  focus?: DashboardWeeklyFocus;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <p className="mt-2 text-sm opacity-60">Checking live training data.</p>
    );
  }

  if (!focus) {
    return (
      <p className="mt-2 text-sm opacity-60">
        Your next Activity starts this week&apos;s field notes.
      </p>
    );
  }

  return (
    <div className="mt-2 flex max-w-2xl flex-wrap items-center gap-x-4 gap-y-1 text-sm opacity-65">
      <p>{focus.body}</p>
      <p className="font-medium opacity-90">Next: {focus.action}</p>
    </div>
  );
}

function LeadMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display font-medium text-xl tabular-nums">{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-[0.12em] opacity-60">
        {label}
      </p>
    </div>
  );
}

function RouteTexture() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 text-journal-route opacity-10 [background-image:radial-gradient(circle_at_20%_20%,currentColor_0_1px,transparent_1.5px),radial-gradient(circle_at_80%_60%,currentColor_0_1px,transparent_1.5px)] [background-size:44px_44px,70px_70px]"
    />
  );
}

function RouteSketch() {
  return (
    <svg
      aria-hidden="true"
      className="absolute right-6 bottom-12 h-48 w-72 text-journal-route opacity-40"
      viewBox="0 0 300 200"
    >
      <path
        d="M290 184C251 167 273 136 228 133C191 130 212 93 174 93C128 94 159 50 111 53C73 55 84 15 22 20"
        fill="none"
        stroke="currentColor"
        strokeDasharray="2 5"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <circle cx="290" cy="184" fill="currentColor" r="5" />
      <circle
        cx="22"
        cy="20"
        fill="none"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function formatFocusStatus(focus?: DashboardWeeklyFocus) {
  return focus?.status ?? "Live";
}

function formatDashboardDate() {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    timeZone: "Australia/Brisbane",
    weekday: "long",
  }).format(new Date());
}

function getGreeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-AU", {
      hour: "numeric",
      hour12: false,
      timeZone: "Australia/Brisbane",
    }).format(new Date()),
  );

  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

function getDistanceProgress(weeklyDistance?: DashboardWeeklyDistance) {
  if (!weeklyDistance || weeklyDistance.averageWeeklyDistanceMeters <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      (weeklyDistance.thisWeekDistanceMeters /
        weeklyDistance.averageWeeklyDistanceMeters) *
        100,
    ),
  );
}

export { DashboardDesktop };
