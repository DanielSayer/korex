import { protectedProcedure } from "../../index";
import {
  executeIncrementalSync,
  executeInitialSync,
} from "./activity-sync.application";

export const activitySyncRouter = {
  incremental: protectedProcedure.handler(async ({ context }) => {
    return executeIncrementalSync(context.session.user.id);
  }),
  initial: protectedProcedure.handler(async ({ context }) => {
    return executeInitialSync(context.session.user.id);
  }),
};
