import type { RouterClient } from "@orpc/server";

import { providerConnectionsRouter } from "../modules/provider-connections/provider-connections.router";

export const appRouter = {
  providerConnections: providerConnectionsRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
