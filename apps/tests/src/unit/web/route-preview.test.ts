import { describe, expect, it } from "vitest";
import { buildRoutePreviewPath } from "../../../../web/src/features/dashboard/utils/route-preview";

describe("route preview", () => {
  it("projects route coordinates into the preview viewport", () => {
    expect(
      buildRoutePreviewPath([
        { latitude: -27.5, longitude: 153 },
        { latitude: -27.4, longitude: 153.1 },
      ]),
    ).toBe("M 8.0 56.0 L 80.0 8.0");
  });

  it("does not draw a route from fewer than two coordinates", () => {
    expect(buildRoutePreviewPath([{ latitude: -27.5, longitude: 153 }])).toBeNull();
  });
});
