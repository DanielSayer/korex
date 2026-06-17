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
    "block rounded-md border p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:rounded-lg md:p-4",
    isSelected && "border-primary/60 bg-primary/5 shadow-sm",
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
          <h2 className="font-semibold text-base">
            {formatTrainingWeek(summary.weekStartAt, summary.weekEndAt)}
          </h2>
          <p className="text-muted-foreground text-sm">
            Generated {formatGeneratedAt(summary.generatedAt)}
          </p>
        </div>
        <DeltaBadge value={summary.previousWeekDistanceDeltaMeters}>
          {formatDistanceDelta(summary.previousWeekDistanceDeltaMeters)}
        </DeltaBadge>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 md:gap-3">
        <Metric
          icon={<RouteIcon className="size-4" />}
          label="Distance"
          value={formatDistance(summary.totalDistanceMeters)}
        />
        <Metric
          icon={<ClockIcon className="size-4" />}
          label="Moving time"
          value={formatDurationCompact(summary.totalMovingTimeSeconds)}
        />
        <Metric
          icon={<GaugeIcon className="size-4" />}
          label="Avg speed"
          value={formatSpeed(summary.averageSpeedMetersPerSecond)}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t pt-3 text-muted-foreground text-sm md:gap-x-5">
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
    <div className="min-w-0 rounded-md bg-muted/50 p-2 md:p-3">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 truncate font-semibold text-sm md:text-lg">
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
    <span className="inline-flex w-fit items-center gap-1 rounded-md border px-2 py-1 font-medium text-sm">
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
