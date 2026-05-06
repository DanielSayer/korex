import { readIntervalsIcuCadenceStepsPerMinute } from "@korex/api/modules/activity-sync/providers/intervals-icu/intervals-icu-readers";
import { describe, expect, it } from "vitest";

describe("Intervals.icu ACL readers", () => {
  it("converts Intervals.icu cadence into steps per minute", () => {
    expect(readIntervalsIcuCadenceStepsPerMinute(87.2)).toBe(174);
    expect(readIntervalsIcuCadenceStepsPerMinute(87.5)).toBe(175);
    expect(readIntervalsIcuCadenceStepsPerMinute(78.91215)).toBe(158);
  });

  it("rejects invalid cadence values", () => {
    expect(readIntervalsIcuCadenceStepsPerMinute(0)).toBeNull();
    expect(readIntervalsIcuCadenceStepsPerMinute(-1)).toBeNull();
    expect(readIntervalsIcuCadenceStepsPerMinute("abc")).toBeNull();
  });
});
