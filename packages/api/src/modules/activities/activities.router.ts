import { z } from "zod";

import { protectedProcedure } from "../../index";
import { summarizeActivitiesByWeek } from "./activity-calendar-summary.service";
import {
  getRecentActivities,
  listActivitiesForDateRange,
} from "./activity-catalog.repository";
import {
  activityRouteHeatmapCellsPerTile,
  activityRouteHeatmapZoomLevels,
} from "./activity-route-heatmap";
import { listActivityRouteHeatmapCellsForViewport } from "./activity-route-heatmap.repository";
import {
  getWeeklyTrainingSummary,
  listWeeklyTrainingSummaries,
} from "./weekly-training-summary.repository";

const listActivitiesInput = z
  .object({
    endDate: z.coerce.date(),
    startDate: z.coerce.date(),
  })
  .refine((input) => input.startDate <= input.endDate, {
    message: "startDate must be before or equal to endDate",
    path: ["startDate"],
  });

const maxRouteHeatmapViewportTiles = 64;
const routeHeatmapZoomValues = [...activityRouteHeatmapZoomLevels] as [
  number,
  ...number[],
];

const routeHeatmapInput = z
  .object({
    maxTileX: z.number().int().nonnegative(),
    maxTileY: z.number().int().nonnegative(),
    minTileX: z.number().int().nonnegative(),
    minTileY: z.number().int().nonnegative(),
    zoom: z.number().int(),
  })
  .refine((input) => routeHeatmapZoomValues.includes(input.zoom), {
    message: "zoom must be a materialized Activity Route Heatmap zoom",
    path: ["zoom"],
  })
  .refine((input) => input.minTileX <= input.maxTileX, {
    message: "minTileX must be before or equal to maxTileX",
    path: ["minTileX"],
  })
  .refine((input) => input.minTileY <= input.maxTileY, {
    message: "minTileY must be before or equal to maxTileY",
    path: ["minTileY"],
  })
  .refine(
    (input) => {
      const tileCount =
        (input.maxTileX - input.minTileX + 1) *
        (input.maxTileY - input.minTileY + 1);

      return tileCount <= maxRouteHeatmapViewportTiles;
    },
    {
      message: "Activity Route Heatmap viewport is too large",
      path: ["maxTileX"],
    },
  )
  .refine(
    (input) => {
      const maxTile = 2 ** input.zoom - 1;

      return (
        input.minTileX <= maxTile &&
        input.maxTileX <= maxTile &&
        input.minTileY <= maxTile &&
        input.maxTileY <= maxTile
      );
    },
    {
      message: "tile coordinates must fit the requested zoom",
      path: ["zoom"],
    },
  );

export const activitiesRouter = {
  getWeeklyTrainingSummary: protectedProcedure
    .input(z.object({ weekStartAt: z.coerce.date() }))
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
