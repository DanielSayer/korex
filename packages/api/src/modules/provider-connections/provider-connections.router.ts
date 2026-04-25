import { IntervalsIcuClientLive } from "@korex/integrations/intervals-icu/live";
import { Effect } from "effect";
import { z } from "zod";

import { protectedProcedure } from "../../index";
import { runProviderConnectionEffect } from "./provider-connections.errors";
import { connectIntervalsIcu } from "./provider-connections.service";

const connectIntervalsIcuInput = z.object({
  apiKey: z.string().min(1),
});

export const providerConnectionsRouter = {
  connectIntervalsIcu: protectedProcedure
    .input(connectIntervalsIcuInput)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      return runProviderConnectionEffect(
        connectIntervalsIcu({
          apiKey: input.apiKey,
          userId,
        }).pipe(Effect.provide(IntervalsIcuClientLive)),
      );
    }),
};
