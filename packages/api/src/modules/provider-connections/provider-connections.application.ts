import { runProviderConnectionOperation } from "./provider-connections.errors";
import {
  type ConnectIntervalsIcuInput,
  providerConnectionsModule,
} from "./provider-connections.service";

export function executeConnectIntervalsIcu(input: ConnectIntervalsIcuInput) {
  return runProviderConnectionOperation(
    providerConnectionsModule.connectIntervalsIcu(input),
  );
}
