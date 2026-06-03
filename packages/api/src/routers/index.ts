import type { RouterClient } from "@orpc/server";

import { activitiesRouter } from "../modules/activities/activities.router";
import { activitySyncRouter } from "../modules/activity-sync/activity-sync.router";
import { heartRateZonesRouter } from "../modules/heart-rate-zones/heart-rate-zones.router";
import { providerConnectionsRouter } from "../modules/provider-connections/provider-connections.router";

export const appRouter = {
  activities: activitiesRouter,
  heartRateZones: heartRateZonesRouter,
  providerConnections: providerConnectionsRouter,
  syncs: activitySyncRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
