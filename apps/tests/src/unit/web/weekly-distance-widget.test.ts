import { describe, expect, it } from "vitest";
import { formatWeekRange } from "../../../../web/src/features/dashboard/components/weekly-distance-formatters";

describe("weekly distance widget", () => {
  it("formats training week ranges in the Brisbane training timezone", () => {
    expect(formatWeekRange("2026-03-01T14:00:00.000Z")).toBe("2 Mar - 8 Mar");
  });
});
