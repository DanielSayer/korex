import { protectedProcedure } from "../../index";
import { getRecentActivities } from "./activity-catalog.repository";

export const activitiesRouter = {
  recent: protectedProcedure.handler(async ({ context }) => {
    return getRecentActivities({
      userId: context.session.user.id,
    });
  }),
};
