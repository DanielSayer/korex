import type { WeeklyTrainingSummaryListItem } from "@korex/api/modules/activities/weekly-training-summaries/weekly-training-summary.types";
import { Link } from "@tanstack/react-router";
import {
  ClockIcon,
  GaugeIcon,
  RouteIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import type React from "react";
import { WaypointDot } from "@/components/brand";
import { cn } from "@/lib/utils";
import {
  formatDistance,
  formatDurationCompact,
  formatSignedNumber,
  formatSpeed,
} from "@/utils/formatters";
import {
  formatDistanceDelta,
  formatGeneratedAt,
  formatTrainingWeek,
  formatTrainingWeekParam,
} from "./weekly-training-summary-formatters";

function WeeklyTrainingSummaryCard({
  isLink,
  isSelected,
  onSelect,
  summary,
}: {
  isLink: boolean;
  isSelected: boolean;
  onSelect: () => void;
  summary: WeeklyTrainingSummaryListItem;
}) {
  const cardClassName = cn(
    "block w-full border-border/40 border-b p-3 text-left transition-colors last:border-b-0 hover:border-journal-route focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
    !isLink && "px-3 py-5 md:px-4",
    isSelected && "border-journal-route bg-accent/50",
  );
  const cardContent = (
    <WeeklyTrainingSummaryCardContent desktop={!isLink} summary={summary} />
  );

  if (isLink) {
    return (
      <Link
        className={cardClassName}
        params={{ weekStartAt: formatTrainingWeekParam(summary.weekStartAt) }}
        to="/weekly-summaries/$weekStartAt"
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <button className={cardClassName} onClick={onSelect} type="button">
      {cardContent}
    </button>
  );
}

function WeeklyTrainingSummaryCardContent({
  desktop,
  summary,
}: {
  desktop: boolean;
  summary: WeeklyTrainingSummaryListItem;
}) {
  if (desktop) {
    return <WeeklyTrainingSummaryDesktopCardContent summary={summary} />;
  }

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="inline-flex items-center gap-2 font-display text-base tracking-tight">
            <WaypointDot className="shrink-0" />
            {formatTrainingWeek(summary.weekStartAt, summary.weekEndAt)}
          </h2>
          <p className="text-muted-foreground text-xs">
            Generated {formatGeneratedAt(summary.generatedAt)}
          </p>
        </div>
        <DeltaBadge value={summary.previousWeekDistanceDeltaMeters}>
          {formatDistanceDelta(summary.previousWeekDistanceDeltaMeters)}
        </DeltaBadge>
      </div>

      <div className="mt-3 grid grid-cols-3 divide-x divide-border/30">
        <Metric
          icon={<RouteIcon className="size-3.5" />}
          label="Distance"
          value={formatDistance(summary.totalDistanceMeters)}
        />
        <Metric
          icon={<ClockIcon className="size-3.5" />}
          label="Time"
          value={formatDurationCompact(summary.totalMovingTimeSeconds)}
        />
        <Metric
          icon={<GaugeIcon className="size-3.5" />}
          label="Avg speed"
          value={formatSpeed(summary.averageSpeedMetersPerSecond)}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs md:gap-x-5">
        <span>{summary.activityCount} activities</span>
        <span>
          {formatSignedNumber(summary.previousWeekActivityCountDelta)} vs
          previous week
        </span>
      </div>
    </>
  );
}

function WeeklyTrainingSummaryDesktopCardContent({
  summary,
}: {
  summary: WeeklyTrainingSummaryListItem;
}) {
  return (
    <div className="grid items-center gap-5 lg:grid-cols-[minmax(13rem,1.1fr)_minmax(19rem,1.5fr)_auto]">
      <div className="min-w-0">
        <h2 className="inline-flex items-center gap-2 font-display text-lg tracking-tight">
          <WaypointDot className="shrink-0 text-journal-route" />
          {formatTrainingWeek(summary.weekStartAt, summary.weekEndAt)}
        </h2>
        <p className="mt-1 text-muted-foreground text-xs">
          Snapshot generated {formatGeneratedAt(summary.generatedAt)}
        </p>
      </div>

      <div className="grid grid-cols-[1.2fr_1fr_1fr] divide-x divide-border/40">
        <Metric
          icon={<RouteIcon className="size-3.5" />}
          label="Distance"
          value={formatDistance(summary.totalDistanceMeters)}
        />
        <Metric
          icon={<ClockIcon className="size-3.5" />}
          label="Moving time"
          value={formatDurationCompact(summary.totalMovingTimeSeconds)}
        />
        <Metric
          icon={<GaugeIcon className="size-3.5" />}
          label="Average speed"
          value={formatSpeed(summary.averageSpeedMetersPerSecond)}
        />
      </div>

      <div className="flex min-w-32 flex-col items-start gap-1 lg:items-end">
        <DeltaBadge value={summary.previousWeekDistanceDeltaMeters}>
          {formatDistanceDelta(summary.previousWeekDistanceDeltaMeters)}
        </DeltaBadge>
        <span className="text-muted-foreground text-xs">
          {summary.activityCount} activities ·{" "}
          {formatSignedNumber(summary.previousWeekActivityCountDelta)} vs
          previous
        </span>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 px-2 first:pl-0 last:pr-0">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {icon}
        <span className="truncate uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-1 truncate font-display text-sm tabular-nums tracking-tight md:text-lg">
        {value}
      </div>
    </div>
  );
}

function DeltaBadge({
  children,
  value,
}: {
  children: React.ReactNode;
  value: number;
}) {
  const positive = value >= 0;

  return (
    <span className="inline-flex w-fit items-center gap-1 font-display text-sm tabular-nums">
      {positive ? (
        <TrendingUpIcon className="size-3.5 text-primary" />
      ) : (
        <TrendingDownIcon className="size-3.5 text-destructive" />
      )}
      {children}
    </span>
  );
}

export { WeeklyTrainingSummaryCard };
