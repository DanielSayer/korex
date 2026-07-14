import { db } from "@korex/db";
import type { ActivityMapInput } from "../activities.types";
import { enqueueActivityRouteHeatmapCalculation } from "../route-heatmap/activity-route-heatmap-jobs.repository";
import { replaceActivityMap } from "./activity-artifacts.repository";

type ActivityArtifactDatabase = NonNullable<
  Parameters<typeof replaceActivityMap>[0]["database"]
>;

export type ActivityArtifactModule = {
  replaceActivityMapAndQueueHeatmapCalculation: (input: {
    activityId: number;
    map: ActivityMapInput;
  }) => Promise<void>;
};

export type ActivityArtifactModuleDependencies = {
  database: Pick<typeof db, "transaction">;
  enqueueActivityRouteHeatmapCalculation: typeof enqueueActivityRouteHeatmapCalculation;
  replaceActivityMap: typeof replaceActivityMap;
};

export function createActivityArtifactModule({
  database,
  enqueueActivityRouteHeatmapCalculation,
  replaceActivityMap,
}: ActivityArtifactModuleDependencies): ActivityArtifactModule {
  return {
    async replaceActivityMapAndQueueHeatmapCalculation({ activityId, map }) {
      await database.transaction(async (transaction) => {
        const activityDatabase = transaction as ActivityArtifactDatabase;

        await replaceActivityMap({
          activityId,
          database: activityDatabase,
          map,
        });
        await enqueueActivityRouteHeatmapCalculation({
          activityId,
          database: activityDatabase,
        });
      });
    },
  };
}

export const activityArtifactModule = createActivityArtifactModule({
  database: db,
  enqueueActivityRouteHeatmapCalculation,
  replaceActivityMap,
});
