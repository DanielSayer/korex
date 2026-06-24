import type { WeeklyTrainingSummaryDetail as WeeklyTrainingSummaryDetailType } from "@korex/api/modules/activities/weekly-training-summaries/weekly-training-summary.types";
import {
  ActivityIcon,
  ClockIcon,
  GaugeIcon,
  MedalIcon,
  RouteIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import { SectionLabel } from "@/components/brand";
import {
  TrainingNotesSection,
  TrainingWeekActivityNotesSection,
} from "@/features/training-notes/components/training-notes-section";
import { cn } from "@/lib/utils";
import {
  formatDistance,
  formatDurationCompact,
  formatSignedNumber,
  formatSpeed,
} from "@/utils/formatters";
import {
  formatActivityDate,
  formatDistanceDelta,
  formatDurationDelta,
  formatSpeedDelta,
  formatTrainingWeek,
} from "./weekly-training-summary-formatters";

function WeeklyTrainingSummaryDetailLoading() {
  return (
    <AnimatedPanelState>
      <div className="flex flex-col gap-4">
        <div className="h-32 animate-pulse rounded-sm bg-muted/40" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 animate-pulse rounded-sm bg-muted/30" />
          <div className="h-20 animate-pulse rounded-sm bg-muted/30" />
        </div>
      </div>
    </AnimatedPanelState>
  );
}

function AnimatedPanelState({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      initial={{ opacity: 0, y: 8 }}
    >
      {children}
    </motion.div>
  );
}

function WeeklyTrainingSummaryDetail({
  summary,
}: {
  summary: WeeklyTrainingSummaryDetailType;
}) {
  const longestActivity = summary.payload.highlights.longestActivity;
  const previousWeek = summary.payload.previousWeek;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      exit={{ opacity: 0, y: -8 }}
      initial={{ opacity: 0, y: 8 }}
      key={summary.id}
      transition={{ duration: 0.22 }}
    >
      <section className="relative overflow-hidden p-4 sm:p-5">
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary via-emerald-500 to-sky-500" />

        <div className="relative">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <SectionLabel>Weekly shape</SectionLabel>
              <h3 className="mt-2 font-display text-lg tracking-tight sm:text-xl">
                {summary.activityCount} activities,{" "}
                {formatDurationCompact(summary.totalMovingTimeSeconds)} moving
              </h3>
            </div>
            <span className="w-fit font-display text-sm tabular-nums">
              {formatDistanceDelta(summary.previousWeekDistanceDeltaMeters)}
            </span>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <RouteIcon className="size-4 text-primary" />
                Total distance
              </div>
              <div className="mt-2 whitespace-nowrap font-display text-4xl tabular-nums tracking-tight sm:text-6xl">
                {formatDistance(summary.totalDistanceMeters)}
              </div>
              <DeltaLine value={summary.previousWeekDistanceDeltaMeters}>
                {formatDistanceDelta(summary.previousWeekDistanceDeltaMeters)}{" "}
                vs previous week
              </DeltaLine>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <HeroMetric
                icon={<ClockIcon className="size-4" />}
                label="Moving time"
                secondary={formatDurationDelta(
                  summary.previousWeekMovingTimeDeltaSeconds,
                )}
                value={formatDurationCompact(summary.totalMovingTimeSeconds)}
              />
              <HeroMetric
                icon={<GaugeIcon className="size-4" />}
                label="Average speed"
                secondary={formatSpeedDelta(
                  summary.previousWeekAverageSpeedDeltaMetersPerSecond,
                )}
                value={formatSpeed(summary.averageSpeedMetersPerSecond)}
              />
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between border-border/40 border-b py-3">
          <SectionLabel>Week-over-week</SectionLabel>
          <span className="text-muted-foreground text-xs">
            {formatTrainingWeek(
              new Date(previousWeek.weekStartAt),
              summary.weekStartAt,
            )}
          </span>
        </div>
        <div className="divide-y divide-border/30">
          <ComparisonRow
            current={formatDistance(summary.totalDistanceMeters)}
            label="Distance"
            previous={formatDistance(previousWeek.totalDistanceMeters)}
            value={formatDistanceDelta(summary.previousWeekDistanceDeltaMeters)}
            valueRaw={summary.previousWeekDistanceDeltaMeters}
          />
          <ComparisonRow
            current={formatDurationCompact(summary.totalMovingTimeSeconds)}
            label="Moving time"
            previous={formatDurationCompact(
              previousWeek.totalMovingTimeSeconds,
            )}
            value={formatDurationDelta(
              summary.previousWeekMovingTimeDeltaSeconds,
            )}
            valueRaw={summary.previousWeekMovingTimeDeltaSeconds}
          />
          <ComparisonRow
            current={formatSpeed(summary.averageSpeedMetersPerSecond)}
            label="Average speed"
            previous={formatSpeed(previousWeek.averageSpeedMetersPerSecond)}
            value={formatSpeedDelta(
              summary.previousWeekAverageSpeedDeltaMetersPerSecond,
            )}
            valueRaw={summary.previousWeekAverageSpeedDeltaMetersPerSecond ?? 0}
          />
          <ComparisonRow
            current={summary.activityCount.toString()}
            label="Activities"
            previous={previousWeek.activityCount.toString()}
            value={formatSignedNumber(summary.previousWeekActivityCountDelta)}
            valueRaw={summary.previousWeekActivityCountDelta}
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <MedalIcon className="size-4 text-primary" />
            <SectionLabel>Longest effort</SectionLabel>
          </div>
          {longestActivity ? (
            <div>
              <p className="font-medium">{longestActivity.name}</p>
              <p className="mt-1 text-muted-foreground text-xs">
                {formatActivityDate(longestActivity.startAt)}
              </p>
              <p className="mt-4 whitespace-nowrap font-display text-2xl tabular-nums tracking-tight sm:text-3xl">
                {formatDistance(longestActivity.distanceMeters)}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No longest activity was captured for this summary.
            </p>
          )}
        </div>
        <div>
          <div className="mb-3 flex items-center gap-2">
            <ActivityIcon className="size-4 text-primary" />
            <SectionLabel>Previous baseline</SectionLabel>
          </div>
          <div className="flex flex-col gap-0">
            <PanelRow
              label="Distance"
              value={formatDistance(
                summary.payload.previousWeek.totalDistanceMeters,
              )}
            />
            <PanelRow
              label="Moving time"
              value={formatDurationCompact(
                summary.payload.previousWeek.totalMovingTimeSeconds,
              )}
            />
            <PanelRow
              label="Activities"
              value={summary.payload.previousWeek.activityCount.toString()}
            />
          </div>
        </div>
      </section>

      <TrainingNotesSection
        title="Week Notes"
        type="trainingWeek"
        weekStartAt={summary.weekStartAt}
      />
      <TrainingWeekActivityNotesSection weekStartAt={summary.weekStartAt} />
    </motion.div>
  );
}

function HeroMetric({
  icon,
  label,
  secondary,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  secondary: string;
  value: string;
}) {
  return (
    <div className="border-border/40 border-t pt-3">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {icon}
        {label}
      </div>
      <div className="mt-2 whitespace-nowrap font-display text-xl tabular-nums tracking-tight sm:text-2xl">
        {value}
      </div>
      <div className="mt-1 text-muted-foreground text-xs">
        {secondary} vs previous
      </div>
    </div>
  );
}

function ComparisonRow({
  current,
  label,
  previous,
  value,
  valueRaw,
}: {
  current: string;
  label: string;
  previous: string;
  value: string;
  valueRaw: number;
}) {
  const positive = valueRaw >= 0;

  return (
    <div className="grid gap-3 px-4 py-3 text-sm sm:grid-cols-[minmax(8rem,1fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_6rem] sm:items-center">
      <div className="font-medium">{label}</div>
      <div>
        <p className="text-muted-foreground text-xs">This week</p>
        <p className="whitespace-nowrap font-semibold">{current}</p>
      </div>
      <div>
        <p className="text-muted-foreground text-xs">Previous</p>
        <p className="whitespace-nowrap text-muted-foreground">{previous}</p>
      </div>
      <div
        className={cn(
          "inline-flex w-fit items-center gap-1 justify-self-start rounded-md px-2 py-1 font-semibold sm:justify-self-end",
          positive
            ? "bg-emerald-500/10 text-emerald-600"
            : "bg-destructive/10 text-destructive",
        )}
      >
        {positive ? (
          <TrendingUpIcon className="size-3.5" />
        ) : (
          <TrendingDownIcon className="size-3.5" />
        )}
        <span className="whitespace-nowrap">{value}</span>
      </div>
    </div>
  );
}

function DeltaLine({
  children,
  value,
}: {
  children: React.ReactNode;
  value: number;
}) {
  return (
    <div
      className={cn(
        "mt-3 flex items-center gap-1.5 font-medium text-sm",
        value >= 0 ? "text-emerald-600" : "text-destructive",
      )}
    >
      {value >= 0 ? (
        <TrendingUpIcon className="size-4" />
      ) : (
        <TrendingDownIcon className="size-4" />
      )}
      {children}
    </div>
  );
}

function PanelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-border/40 border-b py-2 last:border-b-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-display text-sm tabular-nums">{value}</span>
    </div>
  );
}

export {
  AnimatedPanelState,
  WeeklyTrainingSummaryDetail,
  WeeklyTrainingSummaryDetailLoading,
};
