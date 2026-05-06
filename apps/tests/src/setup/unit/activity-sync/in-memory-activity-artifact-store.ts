import type {
  ActivityMapInput,
  ActivityStreamInput,
} from "@korex/api/modules/activities/activities.types";
import { ActivityArtifactStore } from "@korex/api/modules/activity-sync/activity-sync.dependencies";
import { Layer } from "effect";

type ExternalMapRecord = {
  externalActivityId: number;
  lastSyncRunId: number;
  provider: "intervals_icu";
  providerActivityId: string;
  rawData: unknown;
  userId: string;
};

type ExternalStreamRecord = {
  externalActivityId: number;
  lastSyncRunId: number;
  provider: "intervals_icu";
  providerActivityId: string;
  rawData: unknown;
  streamType: string;
  userId: string;
};

export class InMemoryActivityArtifactStore {
  readonly coreMaps = new Map<number, ActivityMapInput>();
  readonly coreStreams = new Map<number, ActivityStreamInput[]>();
  readonly externalMaps = new Map<number, ExternalMapRecord>();
  readonly externalStreams = new Map<string, ExternalStreamRecord>();
  readonly queuedActivityIds: number[] = [];

  readonly layer = Layer.succeed(ActivityArtifactStore, {
    storeExternalMap: async (input) => {
      this.externalMaps.set(input.externalActivityId, input);
    },
    replaceCoreMap: async ({ activityId, map }) => {
      this.coreMaps.set(activityId, map);
    },
    storeExternalStream: async (input) => {
      this.externalStreams.set(
        `${input.externalActivityId}:${input.streamType}`,
        input,
      );
    },
    replaceCoreStreamsAndQueueCalculation: async ({ activityId, streams }) => {
      this.coreStreams.set(activityId, streams);
      this.queuedActivityIds.push(activityId);
    },
  });
}
