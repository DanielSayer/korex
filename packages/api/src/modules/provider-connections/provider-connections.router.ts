import { z } from "zod";

import { protectedProcedure } from "../../index";
import { executeConnectIntervalsIcu } from "./provider-connections.application";
import {
  disconnectProviderConnectionForUser,
  getProviderConnectionOverviewForUser,
} from "./provider-connections.repository";

const connectIntervalsIcuInput = z.object({
  apiKey: z.string().min(1),
});

export const providerConnectionsRouter = {
  overview: protectedProcedure.handler(async ({ context }) => {
    return getProviderConnectionOverviewForUser(context.session.user.id);
  }),
  disconnect: protectedProcedure.handler(async ({ context }) => {
    return disconnectProviderConnectionForUser(context.session.user.id);
  }),
  connectIntervalsIcu: protectedProcedure
    .input(connectIntervalsIcuInput)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      return executeConnectIntervalsIcu({
        apiKey: input.apiKey,
        userId,
      });
    }),
};
