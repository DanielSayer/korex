import type {
  CurrentTrainingWeekQualifyingActivities,
  DashboardWeeklyDistance,
  TrainingStreak,
} from "@korex/api/modules/activities/activities.types";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@korex/ui/components/chart";
import { Link } from "@tanstack/react-router";
import { addDays, format, isSameDay } from "date-fns";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CircleGauge,
  CloudSun,
  Flame,
  Footprints,
  Goal,
  Loader2,
  Map as MapIcon,
  MapPin,
  Mountain,
  RefreshCw,
  Route,
  Settings,
  TimerReset,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardData } from "@/features/dashboard/hooks/use-dashboard-data";
import {
  formatActivityDateTime,
  formatDistance,
  formatDistanceValue,
  formatDurationCompact,
  formatPaceSeconds,
} from "@/utils/formatters";
import { newDashboardConceptData as data } from "./new-dashboard-data";

const navItems = [
  { icon: CircleGauge, label: "Overview", to: "/new-dashboard" },
  { icon: CalendarDays, label: "Calendar", to: "/calendar" },
  { icon: Activity, label: "Analytics", to: "/analytics" },
  { icon: MapIcon, label: "Routes", to: "/heatmap" },
  { icon: Goal, label: "Goals", to: "/goals" },
] as const;

const chartConfig = {
  distanceKilometers: {
    color: "#ff7855",
    label: "Weekly distance",
  },
} satisfies ChartConfig;

type FieldJournalDashboardProps = {
  dashboard: DashboardData;
  firstName: string;
  initials: string;
};

function FieldJournalDashboard({
  dashboard,
  firstName,
  initials,
}: FieldJournalDashboardProps) {
  const weeklyDistance = dashboard.weeklyDistance;
  const thisWeekDistanceMeters =
    dashboard.thisWeek?.distanceMeters ??
    weeklyDistance?.thisWeekDistanceMeters ??
    null;
  const distanceProgress = getDistanceProgress(weeklyDistance);
  const weeklyFocus = dashboard.thisWeek?.weeklyFocus;

  return (
    <div className="min-h-screen bg-[#f3f1e9] font-sans text-[#20241d]">
      <div className="grid min-h-screen grid-cols-[232px_minmax(0,1fr)]">
        <aside className="sticky top-0 flex h-screen flex-col border-[#d8d7cc] border-r bg-[#e7e9dc] px-5 py-6">
          <div className="flex items-center gap-3 px-2">
            <div className="grid size-10 place-items-center rounded-full bg-[#24352c] text-[#e8ff9c]">
              <Route className="size-5" strokeWidth={2.4} />
            </div>
            <div>
              <p className="font-display font-semibold text-xl leading-none">
                korex
              </p>
              <p className="mt-1 text-[#697066] text-[9px] uppercase tracking-[0.22em]">
                Run your way
              </p>
            </div>
          </div>

          <nav className="mt-12 space-y-1" aria-label="Primary navigation">
            {navItems.map(({ icon: Icon, label, to }, index) => (
              <Link
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  index === 0
                    ? "bg-[#24352c] font-medium text-white shadow-[0_10px_25px_-15px_#24352c]"
                    : "text-[#697066] hover:bg-white/60 hover:text-[#24352c]"
                }`}
                key={label}
                to={to}
              >
                <Icon className="size-4" />
                {label}
                {index === 0 ? (
                  <span className="ml-auto size-1.5 rounded-full bg-[#d7f46c]" />
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl bg-[#d8ddc9] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[#63705f] text-[9px] uppercase tracking-[0.18em]">
                Trail conditions
              </span>
              <CloudSun className="size-4 text-[#55614f]" />
            </div>
            <p className="mt-4 font-display font-semibold text-3xl">17°</p>
            <p className="mt-1 text-[#5f695c] text-xs">Cool, dry · 8 km/h</p>
            <p className="mt-3 border-[#bfc5b3] border-t pt-3 text-[#586254] text-[10px] leading-relaxed">
              Good conditions for tomorrow’s long run.
            </p>
          </div>

          <Link
            className="mt-4 flex items-center gap-3 px-3 py-2 text-[#697066] text-sm"
            to="/settings"
          >
            <Settings className="size-4" /> Settings
          </Link>
        </aside>

        <main className="min-w-0 px-8 py-7 xl:px-12 xl:py-9">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-[#767b72] text-[10px] uppercase tracking-[0.2em]">
                {formatDashboardDate()} · {data.location}
              </p>
              <h1 className="mt-2 font-display font-medium text-[42px] leading-none tracking-[-0.04em]">
                Morning, {firstName}.
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                aria-label={
                  dashboard.isSyncing ? "Syncing activities" : "Sync activities"
                }
                className="grid size-10 place-items-center rounded-full border border-[#d1d1c7] bg-white/50 text-[#5c625a]"
                disabled={dashboard.isSyncing}
                onClick={dashboard.onSync}
                type="button"
              >
                {dashboard.isSyncing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
              </button>
              <Link
                className="flex items-center gap-3 rounded-full border border-[#d1d1c7] bg-white/50 py-1.5 pr-4 pl-1.5"
                to="/settings/profile"
              >
                <div className="grid size-8 place-items-center rounded-full bg-[#ff7855] font-semibold text-white text-xs">
                  {initials}
                </div>
                <span className="text-xs">Athlete profile</span>
              </Link>
            </div>
          </header>

          {dashboard.hasError ? (
            <div className="mt-6 rounded-xl border border-[#ff7855]/40 bg-[#ff7855]/10 px-4 py-3 text-[#7b3324] text-sm">
              Some live dashboard data could not be loaded.
            </div>
          ) : null}

          <div className="mt-10 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
            <section className="relative min-h-[360px] overflow-hidden rounded-[28px] bg-[#24352c] px-8 py-7 text-white">
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 20%, #d7f46c 0 1px, transparent 1.5px), radial-gradient(circle at 80% 60%, #d7f46c 0 1px, transparent 1.5px)",
                  backgroundSize: "44px 44px, 70px 70px",
                }}
              />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-[#d7f46c] text-[10px] uppercase tracking-[0.22em]">
                    This week · live
                  </p>
                  <p className="mt-4 max-w-md font-display text-2xl leading-tight">
                    {dashboard.isSummaryLoading
                      ? "Reading the week…"
                      : (weeklyFocus?.title ?? "Start with the next run.")}
                  </p>
                  {weeklyFocus?.body ? (
                    <p className="mt-2 max-w-lg text-white/55 text-xs leading-relaxed">
                      {weeklyFocus.body}
                    </p>
                  ) : null}
                </div>
                <span className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em]">
                  {weeklyFocus?.status ?? "Live"}
                </span>
              </div>

              <div className="relative z-10 mt-14 flex items-end gap-3">
                <span className="font-display font-medium text-[96px] leading-[0.72] tracking-[-0.07em]">
                  {dashboard.isSummaryLoading
                    ? "--"
                    : formatDistanceValue(thisWeekDistanceMeters)}
                </span>
                <span className="mb-1 text-[#cbd2c8] text-xl">km</span>
              </div>
              <div className="relative z-10 mt-8">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em]">
                  <span className="text-[#c8cfc6]">Weekly distance</span>
                  <span>
                    {weeklyDistance
                      ? `${formatDistance(weeklyDistance.averageWeeklyDistanceMeters)} average`
                      : "8-week average"}
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/12">
                  <div
                    className="h-full rounded-full bg-[#d7f46c]"
                    style={{ width: `${distanceProgress}%` }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-6 border-white/10 border-t pt-4">
                  <Metric
                    label="Moving time"
                    value={
                      dashboard.thisWeek
                        ? formatDurationCompact(
                            dashboard.thisWeek.durationSeconds,
                          )
                        : "--"
                    }
                  />
                  <Metric
                    label="Average pace"
                    value={
                      dashboard.thisWeek?.averagePaceSecondsPerKilometer
                        ? `${formatPaceSeconds(
                            dashboard.thisWeek.averagePaceSecondsPerKilometer,
                          )} /km`
                        : "--"
                    }
                  />
                  <Metric
                    label="Activities"
                    value={
                      dashboard.thisWeek
                        ? dashboard.thisWeek.activityCount.toString()
                        : "--"
                    }
                  />
                </div>
              </div>

              <RouteSketch />
            </section>

            <section className="flex min-h-[360px] flex-col rounded-[28px] bg-[#ff7855] p-7 text-[#281f19]">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.2em]">
                  Next on the trail
                </p>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-[#412c22]/20 px-2.5 py-1 text-[8px] uppercase tracking-[0.12em]">
                    Concept
                  </span>
                  <ArrowUpRight className="size-5" />
                </div>
              </div>
              <div className="mt-10 grid size-16 place-items-center rounded-full border border-[#412c22]/25">
                <Footprints className="size-7" />
              </div>
              <p className="mt-6 text-xs uppercase tracking-[0.16em]">
                {data.nextSession.day}
              </p>
              <h2 className="mt-2 font-display font-semibold text-4xl leading-[0.95] tracking-[-0.04em]">
                {data.nextSession.name}
              </h2>
              <div className="mt-auto flex items-end justify-between border-[#412c22]/20 border-t pt-5">
                <div>
                  <p className="font-display font-semibold text-2xl">
                    {data.nextSession.distance}
                  </p>
                  <p className="mt-1 text-xs">{data.nextSession.pace}</p>
                </div>
                <button
                  className="grid size-11 place-items-center rounded-full bg-[#282d24] text-white"
                  type="button"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            </section>
          </div>

          <section className="mt-8 grid gap-8 border-[#d1d1c7] border-y py-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)] xl:divide-x xl:divide-[#d1d1c7]">
            <div className="min-w-0 xl:pr-8">
              <WeeklyDistancePanel
                isLoading={dashboard.isSummaryLoading}
                weeklyDistance={weeklyDistance}
              />
            </div>
            <div className="xl:pl-8">
              <TrainingStreakPanel
                currentWeek={dashboard.currentWeek}
                isError={dashboard.streakHasError}
                isLoading={dashboard.streakLoading}
                streak={dashboard.streak}
              />
            </div>
          </section>

          <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <section>
              <div className="flex items-end justify-between border-[#d1d1c7] border-b pb-4">
                <div>
                  <p className="text-[#777d73] text-[10px] uppercase tracking-[0.2em]">
                    Recent field notes
                  </p>
                  <h2 className="mt-2 font-display font-medium text-2xl">
                    Your latest runs
                  </h2>
                </div>
                <Link
                  className="text-xs underline underline-offset-4"
                  to="/calendar"
                >
                  View all activities
                </Link>
              </div>
              <div className="divide-y divide-[#d8d7cc]">
                {dashboard.recentRunsLoading ? (
                  <div className="py-10 text-[#777d73] text-sm">
                    Reading recent activities…
                  </div>
                ) : null}
                {!dashboard.recentRunsLoading &&
                dashboard.recentRuns.length === 0 ? (
                  <div className="py-10 text-[#777d73] text-sm">
                    Your next Activity will start the field notes.
                  </div>
                ) : null}
                {dashboard.recentRuns.slice(0, 3).map((activity, index) => (
                  <Link
                    className="group grid grid-cols-[48px_minmax(0,1fr)_100px_100px_24px] items-center gap-4 py-4"
                    key={activity.id}
                    params={{ activityId: activity.id.toString() }}
                    to="/activity/$activityId"
                  >
                    <div className="grid size-11 place-items-center rounded-xl bg-[#e4e4d7] text-[#52604e]">
                      {index === 2 ? (
                        <Mountain className="size-5" />
                      ) : (
                        <Route className="size-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{activity.name}</p>
                      <p className="mt-1 truncate text-[#777d73] text-xs">
                        {formatActivityDateTime(activity.startAt)} ·{" "}
                        {activity.noteCount} notes
                      </p>
                    </div>
                    <div>
                      <p className="font-display font-medium text-lg">
                        {formatDistanceValue(activity.distanceMeters)} km
                      </p>
                      <p className="text-[#777d73] text-[10px]">distance</p>
                    </div>
                    <div>
                      <p className="font-display font-medium text-lg">
                        {formatActivityPace({
                          distanceMeters: activity.distanceMeters,
                          durationSeconds: activity.durationSeconds,
                        })}
                      </p>
                      <p className="text-[#777d73] text-[10px]">pace /km</p>
                    </div>
                    <ChevronRight className="size-4 text-[#9ca096] transition group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </section>

            <aside className="space-y-5">
              <section className="rounded-2xl border border-[#d1d1c7] bg-white/35 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[#777d73] text-[10px] uppercase tracking-[0.2em]">
                    Readiness
                  </p>
                  <span className="rounded-full bg-[#dfe6cd] px-2.5 py-1 text-[#566244] text-[9px] uppercase tracking-[0.12em]">
                    Concept data
                  </span>
                </div>
                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <span className="font-display font-semibold text-5xl">
                      {data.readiness.score}
                    </span>
                    <span className="text-[#7b8178] text-sm"> / 100</span>
                  </div>
                  <p className="mb-1 text-[#4e5f45] text-xs">
                    {data.readiness.label}
                  </p>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <MiniMetric
                    icon={TimerReset}
                    label="Sleep"
                    value={data.readiness.sleep}
                  />
                  <MiniMetric
                    icon={Activity}
                    label="Load"
                    value={`${data.readiness.load} · ${data.readiness.loadLabel}`}
                  />
                </div>
              </section>

              <section className="rounded-2xl bg-[#dfe5ce] p-5">
                <div className="flex items-center gap-2 text-[#56604e]">
                  <MapPin className="size-4" />
                  <p className="text-[10px] uppercase tracking-[0.18em]">
                    Coaching note · concept
                  </p>
                </div>
                <p className="mt-4 font-display text-lg leading-snug">
                  “Cadence felt natural on the river loop. Keep that same easy
                  rhythm uphill.”
                </p>
                <p className="mt-4 text-[#6d7567] text-[10px]">
                  Added Thursday
                </p>
              </section>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

function WeeklyDistancePanel({
  isLoading,
  weeklyDistance,
}: {
  isLoading: boolean;
  weeklyDistance?: DashboardWeeklyDistance;
}) {
  const chartData =
    weeklyDistance?.weeklyDistanceBuckets.map((bucket, index, buckets) => ({
      dateLabel: format(new Date(bucket.bucketStartAt), "d MMM"),
      distanceKilometers: bucket.distanceMeters / 1000,
      fullDateLabel: format(new Date(bucket.bucketStartAt), "d MMMM yyyy"),
      isCurrentWeek: index === buckets.length - 1,
    })) ?? [];

  return (
    <section>
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-[#777d73] text-[10px] uppercase tracking-[0.2em]">
            Weekly distance
          </p>
          <h2 className="mt-2 font-display font-medium text-2xl">
            Your recent rhythm
          </h2>
        </div>
        <div className="flex items-end gap-2">
          <span className="font-display font-medium text-4xl tracking-[-0.04em]">
            {isLoading || !weeklyDistance
              ? "--"
              : formatDistanceValue(weeklyDistance.thisWeekDistanceMeters)}
          </span>
          <span className="mb-1 text-[#777d73] text-sm">km this week</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[160px_minmax(0,1fr)] gap-5">
        <div className="flex flex-col justify-center divide-y divide-[#d8d7cc]">
          <DistanceStat
            label="Vs last week"
            value={
              weeklyDistance
                ? formatSignedDistance(weeklyDistance.distanceDeltaMeters)
                : "--"
            }
          />
          <DistanceStat
            label="Average / week"
            value={
              weeklyDistance
                ? formatDistance(weeklyDistance.averageWeeklyDistanceMeters)
                : "--"
            }
          />
          <DistanceStat
            label="Activities"
            value={
              weeklyDistance
                ? (weeklyDistance.weeklyDistanceBuckets
                    .at(-1)
                    ?.activityCount.toString() ?? "0")
                : "--"
            }
          />
        </div>
        <div className="min-w-0">
          {chartData.length > 0 ? (
            <ChartContainer
              className="aspect-auto h-56 w-full"
              config={chartConfig}
              initialDimension={{ height: 224, width: 620 }}
            >
              <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{ bottom: 4, left: 0, right: 0, top: 10 }}
              >
                <defs>
                  <linearGradient
                    id="fieldJournalDistanceFill"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop offset="0" stopColor="#ff7855" stopOpacity={0.35} />
                    <stop offset="1" stopColor="#ff7855" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#d8d7cc"
                  strokeDasharray="2 7"
                  vertical={false}
                />
                <XAxis
                  axisLine={false}
                  dataKey="dateLabel"
                  interval={1}
                  minTickGap={12}
                  tick={{ fill: "#777d73", fontSize: 9 }}
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis
                  axisLine={false}
                  tick={{ fill: "#777d73", fontSize: 9 }}
                  tickLine={false}
                  tickMargin={8}
                  width={25}
                />
                <ReferenceLine stroke="#bfc2b7" y={0} />
                <ChartTooltip
                  content={<FieldJournalDistanceTooltip />}
                  cursor={{ stroke: "#8e948a" }}
                />
                <Area
                  dataKey="distanceKilometers"
                  fill="url(#fieldJournalDistanceFill)"
                  fillOpacity={1}
                  stroke="#ff7855"
                  strokeWidth={2.5}
                  type="monotone"
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="grid h-56 place-items-center rounded-2xl bg-white/30 text-[#777d73] text-sm">
              {isLoading
                ? "Drawing the distance trail…"
                : "No weekly distance yet."}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function TrainingStreakPanel({
  currentWeek,
  isError,
  isLoading,
  streak,
}: {
  currentWeek?: CurrentTrainingWeekQualifyingActivities;
  isError: boolean;
  isLoading: boolean;
  streak?: TrainingStreak | null;
}) {
  if (isLoading) {
    return (
      <div className="h-full min-h-72 animate-pulse rounded-2xl bg-[#e3e3d8]" />
    );
  }

  if (isError || !currentWeek) {
    return (
      <div className="grid min-h-72 place-items-center text-[#777d73] text-sm">
        The streak could not be loaded.
      </div>
    );
  }

  const weekStartAt = new Date(currentWeek.weekStartAt);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStartAt, index);
    return {
      date,
      hasActivity: currentWeek.activities.some((activity) =>
        isSameDay(new Date(activity.startAt), date),
      ),
    };
  });

  return (
    <section className="flex h-full min-h-72 flex-col">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#777d73] text-[10px] uppercase tracking-[0.2em]">
            Training streak
          </p>
          <h2 className="mt-2 font-display font-medium text-2xl">
            Keep the trail alive
          </h2>
        </div>
        <div className="text-right">
          <p className="font-display font-medium text-6xl leading-none tracking-[-0.06em]">
            {streak?.currentStreak ?? 0}
          </p>
          <p className="mt-1 text-[#777d73] text-[9px] uppercase tracking-[0.14em]">
            weeks
          </p>
        </div>
      </div>

      <div className="relative mt-10">
        <div className="absolute top-[18px] right-[7%] left-[7%] h-px bg-[#c6c8bb]" />
        <div className="relative grid grid-cols-7 gap-2">
          {days.map((day) => (
            <div
              className="flex flex-col items-center"
              key={day.date.toISOString()}
            >
              <span
                className={`grid size-9 place-items-center rounded-full border ${
                  day.hasActivity
                    ? "border-[#24352c] bg-[#24352c] text-[#d7f46c]"
                    : "border-[#c5c7bb] bg-[#f3f1e9] text-[#858b81]"
                }`}
                title={
                  day.hasActivity
                    ? "Qualifying Activity logged"
                    : "No qualifying Activity logged"
                }
              >
                {day.hasActivity ? (
                  <Flame className="size-4 fill-[#ff7855] text-[#ff7855]" />
                ) : (
                  <span className="text-[10px]">{format(day.date, "d")}</span>
                )}
              </span>
              <span className="mt-3 text-[#777d73] text-[9px] uppercase">
                {format(day.date, "EEEEE")}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-[#d1d1c7] border-t pt-5">
        <div>
          <p className="text-[#777d73] text-[9px] uppercase tracking-[0.12em]">
            Longest streak
          </p>
          <p className="mt-1 font-display font-medium text-xl">
            {streak?.maxStreak ?? 0} weeks
          </p>
        </div>
        <p className="max-w-44 text-right text-[#697066] text-[10px] leading-relaxed">
          One qualifying Activity keeps this week moving.
        </p>
      </div>
    </section>
  );
}

function FieldJournalDistanceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: {
      distanceKilometers: number;
      fullDateLabel: string;
      isCurrentWeek: boolean;
    };
  }>;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="rounded-xl border border-[#c9cbbf] bg-[#f8f6ef] px-3 py-2 text-[#20241d] shadow-xl">
      <p className="font-medium text-xs">
        {point.isCurrentWeek ? "This week" : point.fullDateLabel}
      </p>
      <p className="mt-1 text-[#697066] text-[10px]">
        {point.distanceKilometers.toFixed(1)} km
      </p>
    </div>
  );
}

function DistanceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <p className="text-[#777d73] text-[9px] uppercase tracking-[0.12em]">
        {label}
      </p>
      <p className="mt-1 font-display font-medium text-lg">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display font-medium text-xl">{value}</p>
      <p className="mt-1 text-[#b9c2b7] text-[9px] uppercase tracking-[0.12em]">
        {label}
      </p>
    </div>
  );
}

function MiniMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-[#f3f1e9] p-3">
      <Icon className="size-3.5 text-[#687061]" />
      <p className="mt-3 text-[#7b8178] text-[9px] uppercase tracking-[0.12em]">
        {label}
      </p>
      <p className="mt-1 font-medium text-[11px]">{value}</p>
    </div>
  );
}

function RouteSketch() {
  return (
    <svg
      aria-hidden="true"
      className="absolute right-4 bottom-13 h-48 w-72 opacity-45"
      viewBox="0 0 300 200"
    >
      <path
        d="M290 184C251 167 273 136 228 133C191 130 212 93 174 93C128 94 159 50 111 53C73 55 84 15 22 20"
        fill="none"
        stroke="#d7f46c"
        strokeDasharray="2 5"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <circle cx="290" cy="184" fill="#d7f46c" r="5" />
      <circle
        cx="22"
        cy="20"
        fill="none"
        r="6"
        stroke="#d7f46c"
        strokeWidth="2"
      />
    </svg>
  );
}

function formatActivityPace({
  distanceMeters,
  durationSeconds,
}: {
  distanceMeters: number | null;
  durationSeconds: number | null;
}) {
  if (!distanceMeters || !durationSeconds) return "--";
  return formatPaceSeconds((durationSeconds / distanceMeters) * 1000);
}

function formatDashboardDate() {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    timeZone: "Australia/Brisbane",
    weekday: "long",
  }).format(new Date());
}

function formatSignedDistance(distanceMeters: number) {
  const sign = distanceMeters >= 0 ? "+" : "−";
  return `${sign}${formatDistance(Math.abs(distanceMeters))}`;
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

export { FieldJournalDashboard };
