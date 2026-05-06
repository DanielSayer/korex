import { ActivitySyncError } from "@korex/api/modules/activity-sync/activity-sync.errors";
import {
  isRecord,
  readNonNegativeInteger,
  readNonNegativeNumber,
  readOptionalString,
  readPositiveInteger,
  readPositiveNumber,
  readRequiredDate,
} from "@korex/api/modules/activity-sync/anti-corruption/readers";
import { describe, expect, it } from "vitest";

describe("ACL readers", () => {
  it("reads trimmed optional strings", () => {
    expect(readOptionalString("  Garmin  ")).toBe("Garmin");
    expect(readOptionalString("   ")).toBeNull();
    expect(readOptionalString(null)).toBeNull();
    expect(readOptionalString(123)).toBeNull();
  });

  it("reads required dates", () => {
    expect(readRequiredDate("2026-04-01T20:00:00.000Z", "start date")).toEqual(
      new Date("2026-04-01T20:00:00.000Z"),
    );
    expect(
      readRequiredDate(new Date("2026-04-01T20:00:00.000Z"), "start date"),
    ).toEqual(new Date("2026-04-01T20:00:00.000Z"));
  });

  it("fails required dates when values are missing or invalid", () => {
    expect(() => readRequiredDate(null, "start date")).toThrow(
      ActivitySyncError,
    );
    expect(() => readRequiredDate("not-a-date", "start date")).toThrow(
      "start date is missing or invalid",
    );
  });

  it("reads non-negative numbers while preserving zero", () => {
    expect(readNonNegativeNumber("12.5")).toBe(12.5);
    expect(readNonNegativeNumber(0)).toBe(0);
    expect(readNonNegativeNumber(-1)).toBeNull();
    expect(readNonNegativeNumber(Number.NaN)).toBeNull();
    expect(readNonNegativeNumber("abc")).toBeNull();
  });

  it("reads positive numbers and rejects zero", () => {
    expect(readPositiveNumber("12.5")).toBe(12.5);
    expect(readPositiveNumber(0)).toBeNull();
    expect(readPositiveNumber(-1)).toBeNull();
    expect(readPositiveNumber(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("rounds integer readers after validating their numeric range", () => {
    expect(readNonNegativeInteger(12.4)).toBe(12);
    expect(readNonNegativeInteger(0)).toBe(0);
    expect(readNonNegativeInteger(-1)).toBeNull();
    expect(readPositiveInteger(12.5)).toBe(13);
    expect(readPositiveInteger(0)).toBeNull();
  });

  it("identifies plain records", () => {
    expect(isRecord({ distance: 1000 })).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isRecord([["distance", 1000]])).toBe(false);
    expect(isRecord("distance")).toBe(false);
  });
});
