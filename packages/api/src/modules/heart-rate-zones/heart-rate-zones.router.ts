import { protectedProcedure } from "../../index";
import { replaceHeartRateZonesInput } from "./heart-rate-zones.inputs";
import {
  listHeartRateZones,
  replaceHeartRateZones,
} from "./heart-rate-zones.repository";

export const heartRateZonesRouter = {
  list: protectedProcedure.handler(async ({ context }) => {
    return listHeartRateZones({
      userId: context.session.user.id,
    });
  }),
  replace: protectedProcedure
    .input(replaceHeartRateZonesInput)
    .handler(async ({ context, input }) => {
      return replaceHeartRateZones({
        userId: context.session.user.id,
        zones: input.zones,
      });
    }),
};
