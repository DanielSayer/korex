import type { WeeklyTrainingSummaryListItem } from "@korex/api/modules/activities/weekly-training-summary.types";
import {
  CalendarDaysIcon,
  ClockIcon,
  GaugeIcon,
  RouteIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  formatDistance,
  formatDurationCompact,
  formatSignedNumber,
  formatSpeed,
} from "@/utils/formatters";
import { WeeklyTrainingSummaryDetailPanel } from "./weekly-training-summary-detail-panel";

type WeeklyTrainingSummaryListProps = {
  summaries: WeeklyTrainingSummaryListItem[];
};

function WeeklyTrainingSummaryList({
  summaries,
}: WeeklyTrainingSummaryListProps) {
  const [selectedSummary, setSelectedSummary] =
    useState<WeeklyTrainingSummaryListItem | null>(null);

  if (summaries.length === 0) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <CalendarDaysIcon className="mb-3 size-8 text-muted-foreground" />
        <h2 className="font-semibold text-lg">No weekly summaries yet</h2>
        <p className="mt-1 max-w-md text-muted-foreground text-sm">
          Completed training weeks will appear here after the worker generates
          their summary.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-2">
        {summaries.map((summary) => (
          <WeeklyTrainingSummaryCard
            isSelected={selectedSummary?.id === summary.id}
            key={summary.id}
            onSelect={() => setSelectedSummary(summary)}
            summary={summary}
          />
        ))}
      </div>
      <WeeklyTrainingSummaryDetailPanel
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSummary(null);
          }
        }}
        summary={selectedSummary}
      />
    </>
  );
}

function WeeklyTrainingSummaryCard({
  isSelected,
  onSelect,
  summary,
}: {
  isSelected: boolean;
  onSelect: () => void;
  summary: WeeklyTrainingSummaryListItem;
}) {
  return (
    <button
      className={cn(
        "rounded-lg border p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        isSelected && "border-primary/60 bg-primary/5 shadow-sm",
      )}
      onClick={onSelect}
      type="button"
    >
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

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
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

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t pt-3 text-muted-foreground text-sm">
        <span>{summary.activityCount} activities</span>
        <span>
          {formatSignedNumber(summary.previousWeekActivityCountDelta)} vs
          previous week
        </span>
      </div>
    </button>
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
    <div className="min-w-0 rounded-md bg-muted/50 p-3">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 truncate font-semibold text-lg">{value}</div>
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

function formatTrainingWeek(weekStartAt: Date, weekEndAt: Date) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
  });
  const start = new Date(weekStartAt);
  const end = new Date(new Date(weekEndAt).getTime() - 1);

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function formatGeneratedAt(generatedAt: Date) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(new Date(generatedAt));
}

function formatDistanceDelta(distanceMeters: number) {
  const sign = distanceMeters >= 0 ? "+" : "-";

  return `${sign}${formatDistance(Math.abs(distanceMeters))}`;
}

export { WeeklyTrainingSummaryList };
