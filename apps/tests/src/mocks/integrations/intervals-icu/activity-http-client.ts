import { IntervalsIcuHttpClient } from "@korex/integrations/intervals-icu/http-client";
import { Effect, Layer } from "effect";

export const intervalsIcuActivityHttpClientSuccess = Layer.succeed(
  IntervalsIcuHttpClient,
  {
    fetch: (path) => {
      if (path.startsWith("/api/v1/athlete/athlete-1/activities")) {
        return Effect.succeed(
          new Response(JSON.stringify([{ id: "activity-1", name: "Run" }]), {
            status: 200,
          }),
        );
      }

      if (path === "/api/v1/activity/activity-1?intervals=true") {
        return Effect.succeed(
          new Response(
            JSON.stringify({
              average_cadence: 174,
              average_heartrate: 151,
              average_speed: 3.25,
              calories: 540,
              device_name: "Garmin Forerunner",
              distance: 10001.5,
              elapsed_time: 3900,
              id: "activity-1",
              max_heartrate: 181,
              max_speed: 5.8,
              moving_time: 3600,
              name: "Run",
              start_date: "2026-03-31T20:00:00.000Z",
              start_date_local: "2026-04-01T06:00:00.000Z",
              total_elevation_gain: 123.4,
              total_elevation_loss: 120.2,
              type: "Run",
            }),
            { status: 200 },
          ),
        );
      }

      if (path === "/api/v1/activity/activity-1/map") {
        return Effect.succeed(
          new Response(JSON.stringify({ polyline: "abc123" }), {
            status: 200,
          }),
        );
      }

      if (path === "/api/v1/activity/activity-1/streams.json") {
        return Effect.succeed(
          new Response(JSON.stringify({ hr: [140, 142], time: [0, 1] }), {
            status: 200,
          }),
        );
      }

      return Effect.succeed(new Response(null, { status: 404 }));
    },
  },
);
