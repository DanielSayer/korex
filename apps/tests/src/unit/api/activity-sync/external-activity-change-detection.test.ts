import {
  hasExternalActivityPayloadChanged,
  hashExternalActivityPayload,
} from "@korex/api/modules/activity-sync/external-activity-change-detection";
import { describe, expect, it } from "vitest";

describe("external activity change detection", () => {
  it("hashes equal payloads consistently", () => {
    expect(hashExternalActivityPayload({ id: "activity-1", name: "Run" })).toBe(
      hashExternalActivityPayload({ id: "activity-1", name: "Run" }),
    );
  });

  it("preserves existing JSON stringify key-order semantics", () => {
    expect(hashExternalActivityPayload({ id: "1", name: "Run" })).not.toBe(
      hashExternalActivityPayload({ name: "Run", id: "1" }),
    );
  });

  it("detects changed payload hashes", () => {
    expect(
      hasExternalActivityPayloadChanged({
        nextPayloadHash: "next",
        previousPayloadHash: "previous",
      }),
    ).toBe(true);
    expect(
      hasExternalActivityPayloadChanged({
        nextPayloadHash: "same",
        previousPayloadHash: "same",
      }),
    ).toBe(false);
    expect(
      hasExternalActivityPayloadChanged({
        nextPayloadHash: "next",
        previousPayloadHash: null,
      }),
    ).toBe(true);
  });
});
