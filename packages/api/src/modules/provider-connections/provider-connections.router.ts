import { z } from "zod";

import { protectedProcedure } from "../../index";
import { executeConnectIntervalsIcu } from "./provider-connections.application";

const connectIntervalsIcuInput = z.object({
  apiKey: z.string().min(1),
});

export const providerConnectionsRouter = {
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
