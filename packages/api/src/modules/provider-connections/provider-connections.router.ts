import { IntervalsIcuClientLive } from "@korex/integrations/intervals-icu/live";
import { ORPCError } from "@orpc/server";
import { Effect } from "effect";
import { z } from "zod";

import { protectedProcedure } from "../../index";
import { connectIntervalsIcu } from "./provider-connections.service";

const connectIntervalsIcuInput = z.object({
  apiKey: z.string().min(1),
});

export const providerConnectionsRouter = {
  connectIntervalsIcu: protectedProcedure
    .input(connectIntervalsIcuInput)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      try {
        return await Effect.runPromise(
          connectIntervalsIcu({
            apiKey: input.apiKey,
            userId,
          }).pipe(Effect.provide(IntervalsIcuClientLive)),
        );
      } catch (cause) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Failed to connect Intervals.icu",
          cause,
        });
      }
    }),
};
