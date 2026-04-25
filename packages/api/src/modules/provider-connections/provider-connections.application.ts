import { IntervalsIcuClientLive } from "@korex/integrations/intervals-icu/live";
import { Effect } from "effect";
import { runProviderConnectionEffect } from "./provider-connections.errors";
import {
  type ConnectIntervalsIcuInput,
  connectIntervalsIcu,
} from "./provider-connections.service";

export function executeConnectIntervalsIcu(input: ConnectIntervalsIcuInput) {
  return runProviderConnectionEffect(
    connectIntervalsIcu(input).pipe(Effect.provide(IntervalsIcuClientLive)),
  );
}
