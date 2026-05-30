import type {
  WeeklyTrainingSummaryDetail as WeeklyTrainingSummaryDetailType,
  WeeklyTrainingSummaryListItem,
} from "@korex/api/modules/activities/weekly-training-summaries/weekly-training-summary.types";
import { Button } from "@korex/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@korex/ui/components/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@korex/ui/components/sheet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIcon,
  ClockIcon,
  GaugeIcon,
  MedalIcon,
  MoreHorizontalIcon,
  MountainSnowIcon,
  RefreshCwIcon,
  RouteIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { toast } from "sonner";
import { ErrorMessage } from "@/components/error-message";
import { QueryRenderer } from "@/components/query-renderer";
import { cn } from "@/lib/utils";
import {
  formatDistance,
  formatDurationCompact,
  formatSignedNumber,
  formatSpeed,
} from "@/utils/formatters";
import { orpc } from "@/utils/orpc";

type WeeklyTrainingSummaryDetailPanelProps = {
  onOpenChange: (open: boolean) => void;
  summary: WeeklyTrainingSummaryListItem | null;
};

function WeeklyTrainingSummaryDetailPanel({
  onOpenChange,
  summary,
}: WeeklyTrainingSummaryDetailPanelProps) {
  const queryClient = useQueryClient();
  const listQuery = orpc.activities.weeklyTrainingSummaries.queryOptions();
  const detailQueryOptions =
    orpc.activities.getWeeklyTrainingSummary.queryOptions({
      input: { weekStartAt: summary?.weekStartAt ?? new Date(0) },
    });
  const detailQuery = useQuery({
    ...detailQueryOptions,
    enabled: summary !== null,
  });
  const regenerateMutation = useMutation(
    orpc.activities.regenerateWeeklyTrainingSummary.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: () => {
        toast.success("Weekly Training Summary regeneration queued");
        queryClient.invalidateQueries({
          queryKey: detailQueryOptions.queryKey,
        });
        queryClient.invalidateQueries({ queryKey: listQuery.queryKey });
      },
    }),
  );

  const handleRegenerate = () => {
    if (!summary) {
      return;
    }

    regenerateMutation.mutate({ weekStartAt: summary.weekStartAt });
  };

  return (
    <Sheet onOpenChange={onOpenChange} open={summary !== null}>
      <SheetContent className="w-full overflow-y-auto p-0 data-[side=right]:sm:w-190 data-[side=right]:sm:max-w-190">
        {summary ? (
          <>
            <SheetHeader className="border-b bg-background p-6">
              <div className="flex items-start justify-between gap-3 pr-10">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
                    <MountainSnowIcon className="size-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <SheetTitle className="text-xl">
                      {formatTrainingWeek(
                        summary.weekStartAt,
                        summary.weekEndAt,
                      )}
                    </SheetTitle>
                    <SheetDescription>
                      Weekly Training Summary generated{" "}
                      {formatGeneratedAt(summary.generatedAt)}
                    </SheetDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        aria-label="Weekly summary actions"
                        size="icon-sm"
                        type="button"
                        variant="outline"
                      />
                    }
                  >
                    <MoreHorizontalIcon className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      disabled={regenerateMutation.isPending}
                      onClick={handleRegenerate}
                    >
                      <RefreshCwIcon
                        className={cn(
                          "size-4",
                          regenerateMutation.isPending && "animate-spin",
                        )}
                      />
                      Regenerate
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </SheetHeader>

            <div className="p-6">
              <AnimatePresence mode="wait">
                <QueryRenderer
                  error={
                    <AnimatedPanelState key="error">
                      <ErrorMessage
                        message="Could not load this weekly summary."
                        variant="banner"
                      />
                    </AnimatedPanelState>
                  }
                  loading={<WeeklyTrainingSummaryDetailLoading key="loading" />}
                  query={detailQuery}
                >
                  {(detail) =>
                    detail ? (
                      <WeeklyTrainingSummaryDetail summary={detail} />
                    ) : (
                      <AnimatedPanelState key="empty">
                        <ErrorMessage
                          message="This weekly summary is no longer available."
                          variant="banner"
                        />
                      </AnimatedPanelState>
                    )
                  }
                </QueryRenderer>
              </AnimatePresence>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function WeeklyTrainingSummaryDetailLoading() {
  return (
    <AnimatedPanelState>
      <div className="space-y-3">
        <div className="h-44 animate-pulse rounded-lg bg-muted" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
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
      <section className="relative overflow-hidden rounded-lg border bg-background p-5">
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary via-emerald-500 to-sky-500" />
        <motion.div
          animate={{ x: [0, 8, 0], y: [0, -5, 0] }}
          className="absolute top-5 right-6 hidden h-24 w-36 sm:block"
          transition={{
            duration: 7,
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
          }}
        >
          <div className="absolute top-2 left-7 size-1.5 rounded-full bg-primary/70" />
          <div className="absolute top-8 left-24 size-1 rounded-full bg-emerald-500/70" />
          <div className="absolute top-16 left-14 size-1 rounded-full bg-sky-500/70" />
          <div className="absolute top-5 left-8 h-px w-20 rotate-12 bg-primary/20" />
          <div className="absolute top-12 left-16 h-px w-16 -rotate-35 bg-emerald-500/20" />
        </motion.div>

        <div className="relative">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-medium text-muted-foreground text-xs uppercase">
                Weekly shape
              </p>
              <h3 className="mt-1 font-semibold text-xl">
                {summary.activityCount} activities,{" "}
                {formatDurationCompact(summary.totalMovingTimeSeconds)} moving
              </h3>
            </div>
            <div className="w-fit rounded-md border bg-muted/30 px-3 py-1.5 font-medium text-sm">
              {formatDistanceDelta(summary.previousWeekDistanceDeltaMeters)}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <RouteIcon className="size-4 text-primary" />
                Total distance
              </div>
              <div className="mt-2 whitespace-nowrap font-semibold text-6xl tracking-tight">
                {formatDistance(summary.totalDistanceMeters)}
              </div>
              <DeltaLine value={summary.previousWeekDistanceDeltaMeters}>
                {formatDistanceDelta(summary.previousWeekDistanceDeltaMeters)}{" "}
                vs previous week
              </DeltaLine>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
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

      <section className="rounded-lg border">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">Week-over-week</h3>
          <span className="text-muted-foreground text-xs">
            Compared with{" "}
            {formatTrainingWeek(
              new Date(previousWeek.weekStartAt),
              summary.weekStartAt,
            )}
          </span>
        </div>
        <div className="divide-y">
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

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border p-5">
          <div className="mb-3 flex items-center gap-2">
            <MedalIcon className="size-4 text-primary" />
            <h3 className="font-semibold">Longest effort</h3>
          </div>
          {longestActivity ? (
            <div>
              <p className="font-medium">{longestActivity.name}</p>
              <p className="mt-1 text-muted-foreground text-sm">
                {formatActivityDate(longestActivity.startAt)}
              </p>
              <p className="mt-4 whitespace-nowrap font-semibold text-3xl">
                {formatDistance(longestActivity.distanceMeters)}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No longest activity was captured for this summary.
            </p>
          )}
        </div>
        <div className="rounded-lg border p-5">
          <div className="mb-3 flex items-center gap-2">
            <ActivityIcon className="size-4 text-primary" />
            <h3 className="font-semibold">Previous baseline</h3>
          </div>
          <div className="space-y-2 text-sm">
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
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {icon}
        {label}
      </div>
      <div className="mt-2 whitespace-nowrap font-semibold text-2xl">
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
    <div className="grid gap-3 px-4 py-3 text-sm sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-center">
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
          "inline-flex w-fit items-center gap-1 rounded-md px-2 py-1 font-semibold",
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
    <div className="flex items-center justify-between gap-3 border-b py-2 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
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

function formatDurationDelta(durationSeconds: number) {
  const sign = durationSeconds >= 0 ? "+" : "-";

  return `${sign}${formatDurationCompact(Math.abs(durationSeconds))}`;
}

function formatSpeedDelta(speedMetersPerSecond: number | null) {
  if (speedMetersPerSecond === null) {
    return "-- km/h";
  }

  const sign = speedMetersPerSecond >= 0 ? "+" : "-";

  return `${sign}${formatSpeed(Math.abs(speedMetersPerSecond))}`;
}

function formatActivityDate(startAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    weekday: "short",
  }).format(new Date(startAt));
}

export { WeeklyTrainingSummaryDetailPanel };
