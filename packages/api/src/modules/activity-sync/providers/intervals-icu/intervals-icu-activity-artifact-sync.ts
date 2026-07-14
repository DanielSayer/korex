import type {
  IntervalsIcuActivityMap,
  IntervalsIcuActivityStreams,
  IntervalsIcuClientService,
} from "@korex/integrations/intervals-icu/client";
import {
  getIntervalsIcuActivityMapRequestUrl,
  getIntervalsIcuActivityStreamsRequestUrl,
} from "@korex/integrations/intervals-icu/urls";
import type {
  ActivityMapInput,
  ActivityStreamInput,
} from "../../../activities/activities.types";
import type { ActivityArtifactStoreService } from "../../activity-sync.dependencies";
import { ActivitySyncError } from "../../activity-sync.errors";
import type { ActivitySyncFailure } from "../../activity-sync.types";
import { toActivityMapFromIntervalsIcuMap } from "./intervals-icu-activity-map.acl";
import { toActivityStreamsFromIntervalsIcuStreams } from "./intervals-icu-activity-streams.acl";
import {
  getErrorDetails,
  getProviderPayloadDetails,
  isRecord,
} from "./intervals-icu-sync-errors";

export type IntervalsIcuActivityArtifactSyncInput = {
  activityId: string;
  apiKey: string;
  artifactStore: ActivityArtifactStoreService;
  client: IntervalsIcuClientService;
  coreActivityId: number;
  errors: ActivitySyncFailure[];
  externalActivityId: number;
  providerActivityId: string;
  signal?: AbortSignal;
  syncRunId: number;
  userId: string;
};

type ArtifactType = "map" | "streams";

type ProviderArtifact =
  | { payload: IntervalsIcuActivityMap; type: "map" }
  | { payload: IntervalsIcuActivityStreams; type: "streams" };

type CoreArtifact =
  | { payload: ActivityMapInput; type: "map" }
  | { payload: ActivityStreamInput[]; type: "streams" };

export async function syncIntervalsIcuActivityArtifact(
  type: ArtifactType,
  input: IntervalsIcuActivityArtifactSyncInput,
) {
  const providerArtifact = await fetchProviderArtifact(type, input);
  if (!providerArtifact) {
    return;
  }

  await storeProviderArtifact(providerArtifact, input);

  const coreArtifact = translateProviderArtifact(providerArtifact, input);
  if (!coreArtifact) {
    return;
  }

  await storeCoreArtifact(coreArtifact, input);
}

async function fetchProviderArtifact(
  type: ArtifactType,
  input: IntervalsIcuActivityArtifactSyncInput,
): Promise<ProviderArtifact | null> {
  try {
    const request = {
      activityId: input.activityId,
      apiKey: input.apiKey,
      signal: input.signal,
    };
    if (type === "map") {
      const payload = await input.client.getActivityMap(request);
      return payload === null ? null : { payload, type };
    }

    const payload = await input.client.getActivityStreams(request);
    return payload === null ? null : { payload, type };
  } catch (cause) {
    input.signal?.throwIfAborted();
    input.errors.push({
      activityId: input.activityId,
      details: getErrorDetails(cause),
      message:
        cause instanceof Error
          ? cause.message
          : `Failed to fetch activity ${type}`,
      requestUrl: readRequestUrl(cause),
      stage: type,
    });
    return null;
  }
}

async function storeProviderArtifact(
  artifact: ProviderArtifact,
  input: IntervalsIcuActivityArtifactSyncInput,
) {
  try {
    const metadata = {
      externalActivityId: input.externalActivityId,
      lastSyncRunId: input.syncRunId,
      provider: "intervals_icu" as const,
      providerActivityId: input.providerActivityId,
      userId: input.userId,
    };

    if (artifact.type === "map") {
      await input.artifactStore.storeExternalMap({
        ...metadata,
        rawData: artifact.payload,
      });
      return;
    }

    for (const [streamType, rawData] of readRawStreamEntries(
      artifact.payload,
    )) {
      await input.artifactStore.storeExternalStream({
        ...metadata,
        rawData,
        streamType,
      });
    }
  } catch (cause) {
    throw new ActivitySyncError({
      cause,
      message: `Failed to store external activity ${artifact.type === "map" ? "map" : "stream"}`,
    });
  }
}

function translateProviderArtifact(
  artifact: ProviderArtifact,
  input: IntervalsIcuActivityArtifactSyncInput,
): CoreArtifact | null {
  try {
    if (artifact.type === "map") {
      const payload = toActivityMapFromIntervalsIcuMap(artifact.payload);
      return payload === null ? null : { payload, type: "map" };
    }

    return {
      payload: toActivityStreamsFromIntervalsIcuStreams(artifact.payload),
      type: "streams",
    };
  } catch (cause) {
    input.errors.push({
      activityId: input.activityId,
      details:
        getErrorDetails(cause) ?? getProviderPayloadDetails(artifact.payload),
      message:
        cause instanceof Error
          ? cause.message
          : `Failed to translate activity ${artifact.type}`,
      requestUrl: getArtifactRequestUrl(artifact.type, input.activityId),
      stage: artifact.type,
    });
    return null;
  }
}

async function storeCoreArtifact(
  artifact: CoreArtifact,
  input: IntervalsIcuActivityArtifactSyncInput,
) {
  try {
    if (artifact.type === "map") {
      await input.artifactStore.replaceCoreMap({
        activityId: input.coreActivityId,
        map: artifact.payload,
      });
      return;
    }

    await input.artifactStore.replaceCoreStreamsAndQueueCalculation({
      activityId: input.coreActivityId,
      streams: artifact.payload,
      userId: input.userId,
    });
  } catch (cause) {
    throw new ActivitySyncError({
      cause,
      message: `Failed to store activity ${artifact.type === "map" ? "map" : "streams"}`,
    });
  }
}

function getArtifactRequestUrl(type: ArtifactType, activityId: string) {
  return type === "map"
    ? getIntervalsIcuActivityMapRequestUrl(activityId)
    : getIntervalsIcuActivityStreamsRequestUrl(activityId);
}

function readRequestUrl(cause: unknown) {
  if (!isRecord(cause) || typeof cause.requestUrl !== "string") {
    return undefined;
  }
  return cause.requestUrl;
}

function readRawStreamEntries(
  streams: IntervalsIcuActivityStreams,
): [string, unknown][] {
  if (Array.isArray(streams)) {
    return streams.map((stream, index) => [
      readRawStreamType(stream) ?? String(index),
      stream,
    ]);
  }

  return Object.entries(streams);
}

function readRawStreamType(stream: unknown) {
  if (!isRecord(stream) || typeof stream.type !== "string") {
    return null;
  }
  return stream.type;
}
