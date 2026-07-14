import { describe, expect, it } from "vitest";
import { toTargetValue } from "../../../../web/src/features/training-goals/components/training-goal-target";

describe("Training Goal target conversion", () => {
  it("converts distance targets from kilometers to rounded meters", () => {
    expect(toTargetValue({ metric: "distance", target: "10.1234" })).toBe(
      10_123,
    );
  });

  it("rounds activity-count targets to a whole number", () => {
    expect(toTargetValue({ metric: "activityCount", target: "4.6" })).toBe(5);
  });

  it.each([
    "",
    "0",
    "-1",
    "not-a-number",
  ])("rejects invalid target %j", (target) => {
    expect(toTargetValue({ metric: "distance", target })).toBeNull();
  });
});
