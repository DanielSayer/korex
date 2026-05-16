import { protectedProcedure } from "../../index";
import {
  getWeeklyTrainingSummaryInput,
  listActivitiesInput,
  routeHeatmapInput,
} from "./activities.inputs";
import {
  getRecentActivities,
  listActivitiesForDateRange,
} from "./catalog/activity-catalog.repository";
import { summarizeActivitiesByWeek } from "./catalog/activity-calendar-summary.service";
import {
  activityRouteHeatmapCellsPerTile,
} from "./route-heatmap/activity-route-heatmap";
import { listActivityRouteHeatmapCellsForViewport } from "./route-heatmap/activity-route-heatmap.repository";
import {
  getWeeklyTrainingSummary,
  listWeeklyTrainingSummaries,
} from "./weekly-training-summaries/weekly-training-summary.repository";

export const activitiesRouter = {
  getWeeklyTrainingSummary: protectedProcedure
    .input(getWeeklyTrainingSummaryInput)
    .handler(async ({ context, input }) => {
      return getWeeklyTrainingSummary({
        userId: context.session.user.id,
        weekStartAt: input.weekStartAt,
      });
    }),
  list: protectedProcedure
    .input(listActivitiesInput)
    .handler(async ({ context, input }) => {
      const activities = await listActivitiesForDateRange({
        endDate: input.endDate,
        startDate: input.startDate,
        userId: context.session.user.id,
      });

      return {
        activities: activities.map(
          ({
            averageHeartRateBeatsPerMinute,
            distanceMeters,
            durationSeconds,
            name,
            startAt,
          }) => ({
            averageHeartRateBeatsPerMinute,
            distanceMeters,
            durationSeconds,
            name,
            startAt,
          }),
        ),
        summaries: summarizeActivitiesByWeek(activities),
      };
    }),
  recent: protectedProcedure.handler(async ({ context }) => {
    return getRecentActivities({
      userId: context.session.user.id,
    });
  }),
  routeHeatmap: protectedProcedure
    .input(routeHeatmapInput)
    .handler(async ({ context, input }) => {
      const cells = await listActivityRouteHeatmapCellsForViewport({
        maxTileX: input.maxTileX,
        maxTileY: input.maxTileY,
        minTileX: input.minTileX,
        minTileY: input.minTileY,
        userId: context.session.user.id,
        zoom: input.zoom,
      });

      return {
        cells,
        cellsPerTile: activityRouteHeatmapCellsPerTile,
        zoom: input.zoom,
      };
    }),
  weeklyTrainingSummaries: protectedProcedure.handler(async ({ context }) => {
    return listWeeklyTrainingSummaries({
      userId: context.session.user.id,
    });
  }),
};
