import type {
  ActivityMapInput,
  ActivityStreamInput,
} from "@korex/api/modules/activities/activities.types";
import type { ActivityArtifactStoreService } from "@korex/api/modules/activity-sync/activity-sync.dependencies";

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
  readonly operations: string[] = [];
  readonly queuedActivityIds: number[] = [];

  readonly adapter: ActivityArtifactStoreService = {
    storeExternalMap: async (input) => {
      this.operations.push("external:map");
      this.externalMaps.set(input.externalActivityId, input);
    },
    replaceCoreMap: async ({ activityId, map }) => {
      this.operations.push("core:map");
      this.coreMaps.set(activityId, map);
    },
    storeExternalStream: async (input) => {
      this.operations.push(`external:stream:${input.streamType}`);
      this.externalStreams.set(
        `${input.externalActivityId}:${input.streamType}`,
        input,
      );
    },
    replaceCoreStreamsAndQueueCalculation: async ({ activityId, streams }) => {
      this.operations.push("core:streams");
      this.coreStreams.set(activityId, streams);
      this.queuedActivityIds.push(activityId);
    },
  };
}
