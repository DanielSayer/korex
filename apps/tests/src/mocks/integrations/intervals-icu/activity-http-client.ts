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
              id: "activity-1",
              name: "Run",
              start_date_local: "2026-04-01T06:00:00.000Z",
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
