import type { IntervalsIcuFetchAdapter } from "@korex/integrations/intervals-icu/http-client";

export const intervalsIcuHttpClientSuccess: IntervalsIcuFetchAdapter = {
  fetch: async () =>
    new Response(
      JSON.stringify({
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
      }),
      { status: 200 },
    ),
};

export const intervalsIcuHttpClientUnauthorized: IntervalsIcuFetchAdapter = {
  fetch: async () =>
    new Response(null, {
      status: 401,
    }),
};

export const intervalsIcuHttpClientInvalidProfile: IntervalsIcuFetchAdapter = {
  fetch: async () =>
    new Response(
      JSON.stringify({
        id: "",
        name: "Test Athlete",
      }),
      { status: 200 },
    ),
};

export const intervalsIcuHttpClientNetworkFailure: IntervalsIcuFetchAdapter = {
  fetch: async () => {
    throw new Error("Network failed");
  },
};
