import type { IntervalsIcuFetchAdapter } from "@korex/integrations/intervals-icu/http-client";
import { createIntervalsIcuClient } from "@korex/integrations/intervals-icu/live";

export function runClient(
  apiKey: string,
  fetchAdapter: IntervalsIcuFetchAdapter,
) {
  return createIntervalsIcuClient(fetchAdapter).getAthleteProfile({
    apiKey,
  });
}

export async function runActivityClient(
  fetchAdapter: IntervalsIcuFetchAdapter,
) {
  const client = createIntervalsIcuClient(fetchAdapter);
  const activities = await client.listActivities({
    apiKey: "test-api-key",
    athleteId: "athlete-1",
    endDate: new Date("2026-04-02T00:00:00.000Z"),
    startDate: new Date("2026-04-01T00:00:00.000Z"),
  });
  const detail = await client.getActivityDetail({
    activityId: "activity-1",
    apiKey: "test-api-key",
  });
  const map = await client.getActivityMap({
    activityId: "activity-1",
    apiKey: "test-api-key",
  });
  const streams = await client.getActivityStreams({
    activityId: "activity-1",
    apiKey: "test-api-key",
  });

  return { activities, detail, map, streams };
}
