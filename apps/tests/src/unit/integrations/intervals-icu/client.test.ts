import { Effect } from "effect";
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
  it("fetches and parses an athlete profile", async () => {
    const athleteProfile = await Effect.runPromise(
      runClient("test-api-key", intervalsIcuHttpClientSuccess),
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
    const result = await Effect.runPromiseExit(
      runClient("bad-api-key", intervalsIcuHttpClientUnauthorized),
    );

    expect(result._tag).toBe("Failure");
  });

  it("fails when the athlete profile response is invalid", async () => {
    const result = await Effect.runPromiseExit(
      runClient("test-api-key", intervalsIcuHttpClientInvalidProfile),
    );

    expect(result._tag).toBe("Failure");
  });

  it("maps http client failures to client failures", async () => {
    const result = await Effect.runPromiseExit(
      runClient("test-api-key", intervalsIcuHttpClientNetworkFailure),
    );

    expect(result._tag).toBe("Failure");
  });

  it("fetches activity detail, map, and streams for a date range", async () => {
    const result = await Effect.runPromise(
      runActivityClient(intervalsIcuActivityHttpClientSuccess),
    );

    expect(result.activities).toEqual([{ id: "activity-1", name: "Run" }]);
    expect(result.detail).toEqual({
      id: "activity-1",
      name: "Run",
      start_date_local: "2026-04-01T06:00:00.000Z",
      type: "Run",
    });
    expect(result.map).toEqual({ polyline: "abc123" });
    expect(result.streams).toEqual({
      hr: [140, 142],
      time: [0, 1],
    });
  });
});
