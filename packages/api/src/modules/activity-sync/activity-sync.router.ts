import { protectedProcedure } from "../../index";
import { executeInitialSync } from "./activity-sync.application";

export const activitySyncRouter = {
  initial: protectedProcedure.handler(async ({ context }) => {
    return executeInitialSync(context.session.user.id);
  }),
};
