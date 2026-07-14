import {
  getIntervalsIcuActivityDetailLive,
  getIntervalsIcuActivityMapLive,
  getIntervalsIcuActivityStreamsLive,
  listIntervalsIcuActivitiesLive,
} from "./activity-live";
import type { IntervalsIcuClientService } from "./client";
import { getIntervalsIcuAthleteProfileLive } from "./get-athlete-profile-live";
import {
  type IntervalsIcuFetchAdapter,
  intervalsIcuFetchAdapter,
} from "./http-client";

export function createIntervalsIcuClient(
  fetchAdapter: IntervalsIcuFetchAdapter,
): IntervalsIcuClientService {
  return {
    getAthleteProfile: (input) =>
      getIntervalsIcuAthleteProfileLive(input, fetchAdapter),
    getActivityDetail: (input) =>
      getIntervalsIcuActivityDetailLive(input, fetchAdapter),
    getActivityMap: (input) =>
      getIntervalsIcuActivityMapLive(input, fetchAdapter),
    getActivityStreams: (input) =>
      getIntervalsIcuActivityStreamsLive(input, fetchAdapter),
    listActivities: (input) =>
      listIntervalsIcuActivitiesLive(input, fetchAdapter),
  };
}

export const intervalsIcuClient = createIntervalsIcuClient(
  intervalsIcuFetchAdapter,
);
