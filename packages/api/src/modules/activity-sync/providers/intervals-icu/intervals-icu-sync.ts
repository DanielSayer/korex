import type { IntervalsIcuClientService } from "@korex/integrations/intervals-icu/client";
import { Effect, Either } from "effect";
import type {
  ActivitySyncCounters,
  ActivitySyncFailure,
} from "../../activity-sync.types";
import { storeIntervalsIcuActivityImport } from "./intervals-icu-activity-import";
import { syncIntervalsIcuActivityMap } from "./intervals-icu-activity-map-sync";
import { syncIntervalsIcuActivityStreams } from "./intervals-icu-activity-streams-sync";

export function syncIntervalsIcuActivity({
  activityId,
  apiKey,
  athleteId,
  client,
  counters,
  errors,
  syncRunId,
  userId,
}: {
  activityId: string;
  apiKey: string;
  athleteId: string;
  client: IntervalsIcuClientService;
  counters: ActivitySyncCounters;
  errors: ActivitySyncFailure[];
  syncRunId: number;
  userId: string;
}) {
  return Effect.gen(function* () {
    const detailResult = yield* Effect.either(
      client.getActivityDetail({
        activityId,
        apiKey,
      }),
    );

    if (Either.isLeft(detailResult)) {
      errors.push({
        activityId,
        details: detailResult.left.details,
        message: detailResult.left.message,
        requestUrl: detailResult.left.requestUrl,
        stage: "detail",
      });
      return;
    }

    const storedActivity = yield* storeIntervalsIcuActivityImport({
      detail: detailResult.right,
      errors,
      lastSyncRunId: syncRunId,
      providerAthleteId: athleteId,
      userId,
    });

    counters.activitiesStored += 1;

    if (storedActivity.skipped) {
      return;
    }

    if (storedActivity.created) {
      counters.activitiesCreated += 1;
    } else if (storedActivity.updated) {
      counters.activitiesUpdated += 1;
    }

    yield* syncIntervalsIcuActivityMap({
      apiKey,
      coreActivityId: storedActivity.activityId,
      client,
      errors,
      externalActivityId: storedActivity.externalActivityId,
      providerActivityId: storedActivity.providerActivityId,
      providerRequestActivityId: activityId,
      syncRunId,
      userId,
    });

    yield* syncIntervalsIcuActivityStreams({
      activityId,
      apiKey,
      client,
      coreActivityId: storedActivity.activityId,
      errors,
      externalActivityId: storedActivity.externalActivityId,
      providerActivityId: storedActivity.providerActivityId,
      syncRunId,
      userId,
    });
  });
}
