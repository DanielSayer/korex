import { describe, expect, it } from "vitest";
import {
  buildCompareChartData,
  formatTooltipXAxis,
  formatXAxisValue,
  normalizeValue,
  sampleChartPoints,
  toStreamChartPoint,
} from "../../../../web/src/features/activities/components/activity-detail/activity-stream-chart-utils";

describe("activity stream chart utils", () => {
  describe("toStreamChartPoint", () => {
    it("uses distance for the x value when distance mode has distance data", () => {
      expect(
        toStreamChartPoint(
          { distanceMeters: 1250, second: 300, value: 142 },
          "distance",
        ),
      ).toEqual({
        distanceMeters: 1250,
        second: 300,
        value: 142,
        xValue: 1250,
      });
    });

    it("falls back to elapsed time when distance mode has no distance data", () => {
      expect(
        toStreamChartPoint(
          { distanceMeters: null, second: 300, value: 142 },
          "distance",
        ).xValue,
      ).toBe(300);
    });
  });

  describe("sampleChartPoints", () => {
    it("returns the original points when the series is within the limit", () => {
      const points = [1, 2, 3];

      expect(sampleChartPoints(points, 3)).toBe(points);
    });

    it("samples evenly across oversized series", () => {
      expect(sampleChartPoints([0, 1, 2, 3, 4, 5], 3)).toEqual([0, 2, 4]);
    });
  });

  describe("normalizeValue", () => {
    it("maps values onto a 0 to 100 relative scale", () => {
      expect(normalizeValue(15, { min: 10, max: 20 })).toBe(50);
    });

    it("centers flat series", () => {
      expect(normalizeValue(10, { min: 10, max: 10 })).toBe(50);
    });
  });

  describe("buildCompareChartData", () => {
    it("normalizes selected streams and keeps raw values for tooltips", () => {
      const chartData = buildCompareChartData(
        {
          altitude: [],
          cadence: [
            { distanceMeters: 100, second: 10, value: 150 },
            { distanceMeters: 200, second: 20, value: 170 },
          ],
          distance: [],
          heartRate: [
            { distanceMeters: 100, second: 10, value: 120 },
            { distanceMeters: 200, second: 20, value: 160 },
          ],
          velocity: [],
        },
        ["heartRate", "cadence"],
        "time",
      );

      expect(chartData).toEqual([
        {
          cadence: 0,
          cadenceRaw: 150,
          distanceMeters: 100,
          heartRate: 0,
          heartRateRaw: 120,
          second: 10,
          xValue: 10,
        },
        {
          cadence: 100,
          cadenceRaw: 170,
          distanceMeters: 200,
          heartRate: 100,
          heartRateRaw: 160,
          second: 20,
          xValue: 20,
        },
      ]);
    });
  });

  describe("axis formatters", () => {
    it("formats distance and elapsed time axis labels", () => {
      expect(formatXAxisValue(2500, "distance")).toBe("2.5 km");
      expect(formatXAxisValue(305, "time")).toBe("5:05");
    });

    it("formats tooltip x-axis labels using distance only when available", () => {
      expect(
        formatTooltipXAxis({ distanceMeters: 1234, second: 300 }, "distance"),
      ).toBe("1.23 km");
      expect(
        formatTooltipXAxis({ distanceMeters: null, second: 300 }, "distance"),
      ).toBe("5:00");
    });
  });
});
