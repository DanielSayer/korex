import type {
  AnalyticsVolume,
  AnalyticsVolumeBucketMode,
} from "@korex/api/modules/activities/activities.types";
import { Button } from "@korex/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@korex/ui/components/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import { ErrorMessage } from "@/components/error-message";
import { QueryRenderer } from "@/components/query-renderer";
import { cn } from "@/lib/utils";
import {
  formatDistance,
  formatDistanceValue,
  formatDurationCompact,
} from "@/utils/formatters";
import { orpc } from "@/utils/orpc";
import { BucketDistanceChart } from "./bucket-distance-chart";
import { CumulativeDistanceChart } from "./cumulative-distance-chart";

type AnalyticsVolumeSectionProps = {
  bucketMode: AnalyticsVolumeBucketMode;
  year: number;
};

function AnalyticsVolumeSection({
  bucketMode,
  year,
}: AnalyticsVolumeSectionProps) {
  const analyticsQuery = useQuery(
    orpc.activities.analyticsVolume.queryOptions({
      input: { bucketMode, year },
    }),
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <QueryRenderer
        error={<ErrorMessage message="Could not load analytics." />}
        loading={<AnalyticsVolumeSkeleton />}
        query={analyticsQuery}
      >
        {(analytics) => <AnalyticsVolumePanel analytics={analytics} />}
      </QueryRenderer>
    </div>
  );
}

function AnalyticsVolumeControls({
  bucketMode,
  className,
  onBucketModeChange,
  onYearChange,
  year,
}: {
  bucketMode: AnalyticsVolumeBucketMode;
  className?: string;
  onBucketModeChange: (bucketMode: AnalyticsVolumeBucketMode) => void;
  onYearChange: (year: number) => void;
  year: number;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <div className="grid h-9 min-w-0 flex-1 grid-cols-2 rounded-md border bg-muted/30 p-0.5 sm:inline-grid sm:flex-none">
        {(["monthly", "weekly"] as const).map((mode) => (
          <Button
            className="h-7 min-w-0 px-2 sm:min-w-20"
            key={mode}
            onClick={() => onBucketModeChange(mode)}
            size="sm"
            type="button"
            variant={bucketMode === mode ? "secondary" : "ghost"}
          >
            {mode === "monthly" ? "Monthly" : "Weekly"}
          </Button>
        ))}
      </div>
      <YearPicker
        className="shrink-0"
        onYearChange={onYearChange}
        year={year}
      />
    </div>
  );
}

function YearPicker({
  className,
  onYearChange,
  year,
}: {
  className?: string;
  onYearChange: (year: number) => void;
  year: number;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 2026 + 1 },
    (_, index) => currentYear - index,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button className={className} size="sm" variant="outline" />}
      >
        <CalendarIcon className="size-4" />
        {year}
        <ChevronDownIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-72">
        <DropdownMenuRadioGroup
          onValueChange={(value) => onYearChange(Number(value))}
          value={year.toString()}
        >
          {years.map((option) => (
            <DropdownMenuRadioItem key={option} value={option.toString()}>
              {option}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AnalyticsVolumePanel({ analytics }: { analytics: AnalyticsVolume }) {
  const summary = getAnalyticsVolumeSummary(analytics);

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-col gap-1">
        <p className="font-display text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
          {analytics.year} total
        </p>
        <p className="font-display text-[clamp(3rem,14vw,3.75rem)] tabular-nums leading-[0.9] tracking-tight">
          {formatDistanceValue(analytics.totalDistanceMeters)}
          <span className="ml-1.5 align-middle font-medium font-sans text-lg text-muted-foreground">
            km
          </span>
        </p>
        <p className="text-muted-foreground text-xs tabular-nums">
          {formatDurationCompact(analytics.totalDurationSeconds)} ·{" "}
          {analytics.totalActivityCount} runs
        </p>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-border/30 border-border/30 border-t sm:grid-cols-3 sm:divide-y-0">
        <StatBlock
          className="pt-3"
          detail={formatDurationCompact(summary.weekDurationSeconds)}
          label="This week"
          value={formatDistance(summary.weekDistanceMeters)}
        />
        <StatBlock
          className="pt-3"
          detail={formatDurationCompact(summary.monthDurationSeconds)}
          label="This month"
          value={formatDistance(summary.monthDistanceMeters)}
        />
        <StatBlock
          className="pt-3"
          detail={`${summary.monthActivityCount} runs`}
          label="Avg / week"
          value={formatDistance(summary.averageWeeklyDistanceMeters)}
        />
      </div>
      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <BucketDistanceChart analytics={analytics} />
        <CumulativeDistanceChart analytics={analytics} />
      </div>
    </div>
  );
}

function StatBlock({
  className,
  detail,
  label,
  value,
}: {
  className?: string;
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 px-3 py-2 first:pl-0 last:pr-0",
        className,
      )}
    >
      <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className="font-display text-xl tabular-nums tracking-tight">
        {value}
      </span>
      <span className="text-muted-foreground text-xs tabular-nums">
        {detail}
      </span>
    </div>
  );
}

function getAnalyticsVolumeSummary(analytics: AnalyticsVolume) {
  const periodDate = getSelectedYearPeriodDate(analytics.year);
  const monthBucket = analytics.monthlyBuckets.find((bucket) =>
    isSameMonth(toDate(bucket.bucketStartAt), periodDate),
  );
  const weekBucket = analytics.weeklyBuckets.find(
    (bucket) =>
      periodDate >= toDate(bucket.bucketStartAt) &&
      periodDate < toDate(bucket.bucketEndAt),
  );
  const weeklyBucketCount = analytics.weeklyBuckets.length;

  return {
    averageMonthlyDistanceMeters: analytics.totalDistanceMeters / 12,
    averageMonthlyDurationSeconds: Math.round(
      analytics.totalDurationSeconds / 12,
    ),
    averageWeeklyDistanceMeters:
      weeklyBucketCount === 0
        ? 0
        : analytics.totalDistanceMeters / weeklyBucketCount,
    averageWeeklyDurationSeconds:
      weeklyBucketCount === 0
        ? 0
        : Math.round(analytics.totalDurationSeconds / weeklyBucketCount),
    monthActivityCount: monthBucket?.activityCount ?? 0,
    monthDistanceMeters: monthBucket?.distanceMeters ?? 0,
    monthDurationSeconds: monthBucket?.durationSeconds ?? 0,
    weekDistanceMeters: weekBucket?.distanceMeters ?? 0,
    weekDurationSeconds: weekBucket?.durationSeconds ?? 0,
  };
}

function getSelectedYearPeriodDate(year: number) {
  const now = new Date();

  return new Date(
    year,
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds(),
  );
}

function isSameMonth(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth()
  );
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function AnalyticsVolumeSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-col gap-1">
        <div className="h-3 w-20 animate-pulse rounded-sm bg-muted/60" />
        <div className="h-12 w-40 animate-pulse rounded-sm bg-muted/50" />
        <div className="h-3 w-32 animate-pulse rounded-sm bg-muted/40" />
      </div>
      <div className="grid grid-cols-2 border-border/30 border-t sm:grid-cols-3">
        {["week", "month", "avg"].map((key) => (
          <div className="flex flex-col gap-1.5 px-3 py-3" key={key}>
            <div className="h-3 w-16 animate-pulse rounded-sm bg-muted/40" />
            <div className="h-5 w-20 animate-pulse rounded-sm bg-muted/50" />
          </div>
        ))}
      </div>
      <div className="h-64 w-full animate-pulse rounded-lg bg-muted/30" />
    </div>
  );
}

export { AnalyticsVolumeControls, AnalyticsVolumeSection };
