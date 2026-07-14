import {
  type IntervalsIcuActivityArtifactSyncInput,
  syncIntervalsIcuActivityArtifact,
} from "./intervals-icu-activity-artifact-sync";

export function syncIntervalsIcuActivityMap(
  input: IntervalsIcuActivityArtifactSyncInput,
) {
  return syncIntervalsIcuActivityArtifact("map", input);
}
