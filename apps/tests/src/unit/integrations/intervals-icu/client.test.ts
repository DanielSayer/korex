import { IntervalsIcuClientError } from "@korex/integrations/intervals-icu/client";
import { createIntervalsIcuClient } from "@korex/integrations/intervals-icu/live";
import { describe, expect, it } from "vitest";
import { intervalsIcuActivityHttpClientSuccess } from "../../../mocks/integrations/intervals-icu/activity-http-client";
import {
  intervalsIcuHttpClientInvalidProfile,
  intervalsIcuHttpClientNetworkFailure,
  intervalsIcuHttpClientSuccess,
  intervalsIcuHttpClientUnauthorized,
} from "../../../mocks/integrations/intervals-icu/http-client";
import { runActivityClient, runClient } from "./client-runners";

describe("Intervals.icu client", () => {
  it("propagates AbortSignal to provider requests", async () => {
    const controller = new AbortController();
    const client = createIntervalsIcuClient({
      fetch: async (_path, init) => {
        expect(init.signal).toBe(controller.signal);
        return new Response(JSON.stringify({ id: "123" }), { status: 200 });
      },
    });

    await client.getAthleteProfile({
      apiKey: "test-api-key",
      signal: controller.signal,
    });
  });

  it("fetches and parses an athlete profile", async () => {
    const athleteProfile = await runClient(
      "test-api-key",
      intervalsIcuHttpClientSuccess,
    );

    expect(athleteProfile).toEqual({
      email: null,
      firstname: "Test",
      id: "123",
      lastname: "Athlete",
      name: "Test Athlete",
      sportSettings: [
        {
          hr_zone_names: ["Recovery", "Aerobic"],
          hr_zones: [153, 170],
        },
      ],
      timezone: "Australia/Brisbane",
    });
  });

  it("fails when the athlete profile request is rejected", async () => {
    await expect(
      runClient("bad-api-key", intervalsIcuHttpClientUnauthorized),
    ).rejects.toMatchObject({
      _tag: "IntervalsIcuClientError",
      message: "Intervals.icu athlete profile request failed",
      status: 401,
    });
  });

  it("fails when the athlete profile response is invalid", async () => {
    await expect(
      runClient("test-api-key", intervalsIcuHttpClientInvalidProfile),
    ).rejects.toBeInstanceOf(IntervalsIcuClientError);
  });

  it("maps http client failures to client failures", async () => {
    await expect(
      runClient("test-api-key", intervalsIcuHttpClientNetworkFailure),
    ).rejects.toMatchObject({
      _tag: "IntervalsIcuClientError",
      message: "Failed to request Intervals.icu athlete profile",
    });
  });

  it("fetches activity detail, map, and streams for a date range", async () => {
    const result = await runActivityClient(
      intervalsIcuActivityHttpClientSuccess,
    );

    expect(result.activities).toEqual([{ id: "activity-1", name: "Run" }]);
    expect(result.detail).toMatchObject({
      id: "activity-1",
      name: "Run",
      start_date_local: "2026-04-01T06:00:00",
      type: "Run",
    });
    expect(result.map).toMatchObject({
      bounds: [
        [-27.590372, 153.06575],
        [-27.58015, 153.07713],
      ],
      latlngs: [
        [-27.581491, 153.06828],
        [-27.581144, 153.06902],
      ],
    });
    expect(result.streams).toEqual({
      cadence: {
        data: [82, 83],
        name: null,
        type: "cadence",
      },
      distance: {
        data: [0, 8.5],
        name: null,
        type: "distance",
      },
      fixed_altitude: {
        data: [48.1, 48.3],
        name: null,
        type: "fixed_altitude",
      },
      heartrate: {
        data: [140, 142],
        name: null,
        type: "heartrate",
      },
      time: {
        data: [0, 2],
        name: null,
        type: "time",
      },
      velocity_smooth: {
        data: [3.1, 3.2],
        name: null,
        type: "velocity_smooth",
      },
    });
  });

  it("includes the requested activity list URL on list failures", async () => {
    await expect(
      runActivityClient({
        fetch: async () => new Response(null, { status: 502 }),
      }),
    ).rejects.toMatchObject({
      message: "Intervals.icu activity list request failed",
      requestUrl:
        "https://intervals.icu/api/v1/athlete/athlete-1/activities?oldest=2026-04-01&newest=2026-04-02",
      status: 502,
    });
  });
});
