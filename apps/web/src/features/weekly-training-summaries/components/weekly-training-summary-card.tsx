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
    "block border-border/40 border-b p-3 text-left transition-colors last:border-b-0 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:rounded-lg md:border md:p-4 md:last:border",
    isSelected && "md:border-primary/60 md:bg-primary/5",
  );
  const cardContent = <WeeklyTrainingSummaryCardContent summary={summary} />;

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
  summary,
}: {
  summary: WeeklyTrainingSummaryListItem;
}) {
  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-base tracking-tight">
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
        <TrendingUpIcon className="size-3.5 text-emerald-600" />
      ) : (
        <TrendingDownIcon className="size-3.5 text-destructive" />
      )}
      {children}
    </span>
  );
}

export { WeeklyTrainingSummaryCard };
