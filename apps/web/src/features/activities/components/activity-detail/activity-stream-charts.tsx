import type {
  ActivityDetailSummary,
  ActivityStreamsChartData,
} from "@korex/api/modules/activities/activities.types";
import { Button } from "@korex/ui/components/button";
import { ActivityIcon } from "lucide-react";
import { useState } from "react";
import { ActivityStreamChart } from "./activity-stream-chart";
import {
  type ChartMetric,
  visibleMetrics,
  type XAxisMode,
} from "./activity-stream-chart-utils";
import { ActivityStreamCompareChart } from "./activity-stream-compare-chart";

type ActivityStreamChartsProps = {
  streams: ActivityStreamsChartData;
  summary: ActivityDetailSummary;
};

function ActivityStreamCharts({ streams, summary }: ActivityStreamChartsProps) {
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
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-2xl md:text-3xl">
            <ActivityIcon className="size-5 md:size-6" />
            Activity Streams
          </h2>
        </div>
        {hasDistanceAxis ? (
          <div className="flex items-center gap-1 md:rounded-md md:border md:p-1">
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
        streams={streams}
        xAxisMode={activeXAxisMode}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <ActivityStreamChart
          averageValue={summary.activity.averageHeartRateBeatsPerMinute}
          metric="heartRate"
          referenceLabel="Avg"
          series={streams.heartRate}
          xAxisMode={activeXAxisMode}
        />
        <ActivityStreamChart
          averageValue={summary.activity.averageCadenceStepsPerMinute}
          metric="cadence"
          referenceLabel="Avg"
          series={streams.cadence}
          xAxisMode={activeXAxisMode}
        />
        <ActivityStreamChart
          averageValue={summary.activity.averageSpeedMetersPerSecond}
          metric="velocity"
          referenceLabel="Avg"
          series={streams.velocity}
          xAxisMode={activeXAxisMode}
        />
        <ActivityStreamChart
          metric="altitude"
          series={streams.altitude}
          xAxisMode={activeXAxisMode}
        />
      </div>
    </section>
  );
}

export { ActivityStreamCharts };
