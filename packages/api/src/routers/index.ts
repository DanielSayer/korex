import type { RouterClient } from "@orpc/server";

import { activitySyncRouter } from "../modules/activity-sync/activity-sync.router";
import { providerConnectionsRouter } from "../modules/provider-connections/provider-connections.router";

export const appRouter = {
  providerConnections: providerConnectionsRouter,
  syncs: activitySyncRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
