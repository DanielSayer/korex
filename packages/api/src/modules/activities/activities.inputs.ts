import { z } from "zod";

import { activityRouteHeatmapZoomLevels } from "./activity-route-heatmap";

export const listActivitiesInput = z
  .object({
    endDate: z.coerce.date(),
    startDate: z.coerce.date(),
  })
  .refine((input) => input.startDate <= input.endDate, {
    message: "startDate must be before or equal to endDate",
    path: ["startDate"],
  });

export const getWeeklyTrainingSummaryInput = z.object({
  weekStartAt: z.coerce.date(),
});

const maxRouteHeatmapViewportTiles = 64;
const routeHeatmapZoomValues = [...activityRouteHeatmapZoomLevels] as [
  number,
  ...number[],
];

export const routeHeatmapInput = z
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
