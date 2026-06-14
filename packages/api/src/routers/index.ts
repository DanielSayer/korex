import type { RouterClient } from "@orpc/server";

import { activitiesRouter } from "../modules/activities/activities.router";
import { activitySyncRouter } from "../modules/activity-sync/activity-sync.router";
import { equipmentRouter } from "../modules/equipment/equipment.router";
import { heartRateZonesRouter } from "../modules/heart-rate-zones/heart-rate-zones.router";
import { providerConnectionsRouter } from "../modules/provider-connections/provider-connections.router";
import { trainingNotesRouter } from "../modules/training-notes/training-notes.router";

export const appRouter = {
  activities: activitiesRouter,
  equipment: equipmentRouter,
  heartRateZones: heartRateZonesRouter,
  providerConnections: providerConnectionsRouter,
  syncs: activitySyncRouter,
  trainingNotes: trainingNotesRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
