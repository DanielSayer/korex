import {
  type IntervalsIcuActivityArtifactSyncInput,
  syncIntervalsIcuActivityArtifact,
} from "./intervals-icu-activity-artifact-sync";

export function syncIntervalsIcuActivityStreams(
  input: IntervalsIcuActivityArtifactSyncInput,
) {
  return syncIntervalsIcuActivityArtifact("streams", input);
}
