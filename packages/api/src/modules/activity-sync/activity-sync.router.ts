import { protectedProcedure } from "../../index";
import { createDurableActivitySyncApplication } from "./activity-sync.application";
import { activitySyncCommandModule } from "./activity-sync.live";

export type ActivitySyncApplication<IncrementalResult, InitialResult> = {
  executeIncrementalSync: (userId: string) => Promise<IncrementalResult>;
  executeInitialSync: (userId: string) => Promise<InitialResult>;
};

export function createActivitySyncRouter<IncrementalResult, InitialResult>(
  application: ActivitySyncApplication<IncrementalResult, InitialResult>,
) {
  return {
    incremental: protectedProcedure.handler(async ({ context }) => {
      return application.executeIncrementalSync(context.session.user.id);
    }),
    initial: protectedProcedure.handler(async ({ context }) => {
      return application.executeInitialSync(context.session.user.id);
    }),
  };
}

export const activitySyncRouter = createActivitySyncRouter(
  createDurableActivitySyncApplication(activitySyncCommandModule),
);
