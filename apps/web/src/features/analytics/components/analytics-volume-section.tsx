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
import { Skeleton } from "@korex/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import { ErrorMessage } from "@/components/error-message";
import { QueryRenderer } from "@/components/query-renderer";
import { formatDistance, formatDurationCompact } from "@/utils/formatters";
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
    <div className="flex flex-col gap-4">
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
  onBucketModeChange,
  onYearChange,
  year,
}: {
  bucketMode: AnalyticsVolumeBucketMode;
  onBucketModeChange: (bucketMode: AnalyticsVolumeBucketMode) => void;
  onYearChange: (year: number) => void;
  year: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="inline-grid h-9 grid-cols-2 rounded-md border bg-muted/30 p-0.5">
        {(["monthly", "weekly"] as const).map((mode) => (
          <Button
            className="h-7 min-w-20"
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
      <YearPicker onYearChange={onYearChange} year={year} />
    </div>
  );
}

function YearPicker({
  onYearChange,
  year,
}: {
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
      <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
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
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          detail={formatDurationCompact(analytics.totalDurationSeconds)}
          label="This year"
          value={formatDistance(analytics.totalDistanceMeters)}
        />
        <MetricCard
          detail={formatDurationCompact(summary.weekDurationSeconds)}
          label="This week"
          value={formatDistance(summary.weekDistanceMeters)}
        />
        <MetricCard
          detail={formatDurationCompact(summary.monthDurationSeconds)}
          label="This month"
          value={formatDistance(summary.monthDistanceMeters)}
        />
        <MetricCard
          detail={`${summary.monthActivityCount} this month`}
          label="Yearly activity count"
          value={analytics.totalActivityCount.toString()}
        />
        <MetricCard
          detail={formatDurationCompact(summary.averageMonthlyDurationSeconds)}
          label="Average monthly distance"
          value={formatDistance(summary.averageMonthlyDistanceMeters)}
        />
        <MetricCard
          detail={formatDurationCompact(summary.averageWeeklyDurationSeconds)}
          label="Average weekly distance"
          value={formatDistance(summary.averageWeeklyDistanceMeters)}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BucketDistanceChart analytics={analytics} />
        <CumulativeDistanceChart analytics={analytics} />
      </div>
    </div>
  );
}

function MetricCard({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-muted-foreground text-sm">{label}</div>
      <div className="mt-1 font-semibold text-2xl tracking-tight">{value}</div>
      <div className="mt-1 text-muted-foreground text-sm">{detail}</div>
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
    <div className="rounded-lg border p-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
      <Skeleton className="mt-5 h-80" />
    </div>
  );
}

export { AnalyticsVolumeControls, AnalyticsVolumeSection };
