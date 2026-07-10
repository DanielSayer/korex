import type {
  ActivityDetailSummary,
  ActivityStreamsChartData,
} from "@korex/api/modules/activities/activities.types";
import { Button } from "@korex/ui/components/button";
import { useState } from "react";
import { SectionLabel } from "@/components/brand";
import { ActivityStreamChart } from "./activity-stream-chart";
import {
  type ChartMetric,
  visibleMetrics,
  type XAxisMode,
} from "./activity-stream-chart-utils";
import { ActivityStreamCompareChart } from "./activity-stream-compare-chart";

type ActivityStreamChartsProps = {
  desktop?: boolean;
  streams: ActivityStreamsChartData;
  summary: ActivityDetailSummary;
};

function ActivityStreamCharts({
  desktop = false,
  streams,
  summary,
}: ActivityStreamChartsProps) {
  const [xAxisMode, setXAxisMode] = useState<XAxisMode>("time");
  const hasDistanceAxis = visibleMetrics.some((metric) =>
    streams[metric].some((point) => point.distanceMeters !== null),
  );
  const availableMetrics = visibleMetrics.filter(
    (metric): metric is ChartMetric => streams[metric].length > 0,
  );
  const hasStreamData = availableMetrics.length > 0;

  if (!hasStreamData) {
    return null;
  }

  const activeXAxisMode = hasDistanceAxis ? xAxisMode : "time";

  return (
    <section
      className={
        desktop
          ? "flex flex-col gap-6 border-border/50 border-y py-8"
          : "flex flex-col gap-4"
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionLabel>Activity streams</SectionLabel>
        {hasDistanceAxis ? (
          <div
            className={
              desktop
                ? "flex items-center gap-1 rounded-lg bg-muted/40 p-1"
                : "flex items-center gap-1 md:rounded-md md:border md:p-1"
            }
          >
            <Button
              onClick={() => setXAxisMode("time")}
              size="sm"
              type="button"
              variant={activeXAxisMode === "time" ? "default" : "ghost"}
            >
              Time
            </Button>
            <Button
              onClick={() => setXAxisMode("distance")}
              size="sm"
              type="button"
              variant={activeXAxisMode === "distance" ? "default" : "ghost"}
            >
              Distance
            </Button>
          </div>
        ) : null}
      </div>

      <ActivityStreamCompareChart
        availableMetrics={availableMetrics}
        desktop={desktop}
        streams={streams}
        xAxisMode={activeXAxisMode}
      />

      <div
        className={
          desktop ? "grid xl:grid-cols-2" : "grid gap-4 xl:grid-cols-2"
        }
      >
        <ActivityStreamChart
          averageValue={summary.activity.averageHeartRateBeatsPerMinute}
          desktop={desktop}
          metric="heartRate"
          referenceLabel="Avg"
          series={streams.heartRate}
          xAxisMode={activeXAxisMode}
        />
        <ActivityStreamChart
          averageValue={summary.activity.averageCadenceStepsPerMinute}
          desktop={desktop}
          metric="cadence"
          referenceLabel="Avg"
          series={streams.cadence}
          xAxisMode={activeXAxisMode}
        />
        <ActivityStreamChart
          averageValue={summary.activity.averageSpeedMetersPerSecond}
          desktop={desktop}
          metric="velocity"
          referenceLabel="Avg"
          series={streams.velocity}
          xAxisMode={activeXAxisMode}
        />
        <ActivityStreamChart
          desktop={desktop}
          metric="altitude"
          series={streams.altitude}
          xAxisMode={activeXAxisMode}
        />
      </div>
    </section>
  );
}

export { ActivityStreamCharts };
