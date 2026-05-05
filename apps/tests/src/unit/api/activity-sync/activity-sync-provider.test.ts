import { ActivitySyncProviderNotSupportedError } from "@korex/api/modules/activity-sync/activity-sync.errors";
import { getActivitySyncProvider } from "@korex/api/modules/activity-sync/activity-sync.service";
import { describe, expect, it } from "vitest";

describe("getActivitySyncProvider", () => {
  it("returns supported activity sync providers", () => {
    expect(getActivitySyncProvider("intervals_icu")).toBe("intervals_icu");
  });

  it("throws when the provider is not supported", () => {
    expect(() =>
      // biome-ignore lint/suspicious/noExplicitAny: <explanation> for testing unsupported provider
      getActivitySyncProvider("unsupported_provider" as any),
    ).toThrow(ActivitySyncProviderNotSupportedError);
  });
});
