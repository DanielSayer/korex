import { describe, expect, it } from "vitest";
import {
  formatActivityDateTime,
  formatBpm,
  formatDistance,
  formatDistanceValue,
  formatDurationClock,
  formatDurationCompact,
  formatMeters,
  formatSignedNumber,
  formatSpeed,
} from "../../../../web/src/utils/formatters";

describe("web formatters", () => {
  describe("formatDistance", () => {
    it("formats meters as kilometers with one decimal place", () => {
      expect(formatDistance(12_345)).toBe("12.3 km");
    });

    it("formats missing distance with an empty metric value", () => {
      expect(formatDistance(null)).toBe("-- km");
    });
  });

  describe("formatDistanceValue", () => {
    it("formats meters as a kilometer value with two decimal places", () => {
      expect(formatDistanceValue(12_345)).toBe("12.35");
    });

    it("formats missing distance with an empty value", () => {
      expect(formatDistanceValue(null)).toBe("--");
    });
  });

  describe("formatDurationClock", () => {
    it("formats sub-hour durations as minutes and seconds", () => {
      expect(formatDurationClock(305)).toBe("5:05");
    });

    it("formats hour durations as hours, minutes, and seconds", () => {
      expect(formatDurationClock(3725)).toBe("1:02:05");
    });

    it("formats missing duration with an empty value", () => {
      expect(formatDurationClock(null)).toBe("--");
    });
  });

  describe("formatDurationCompact", () => {
    it("formats sub-hour durations as minutes", () => {
      expect(formatDurationCompact(305)).toBe("5m");
    });

    it("formats hour durations as hours and minutes", () => {
      expect(formatDurationCompact(3725)).toBe("1h 2m");
    });
  });

  describe("formatSpeed", () => {
    it("formats meters per second as kilometers per hour", () => {
      expect(formatSpeed(3.5)).toBe("12.6 km/h");
    });

    it("formats missing speed with an empty metric value", () => {
      expect(formatSpeed(null)).toBe("-- km/h");
    });
  });

  describe("formatActivityDateTime", () => {
    it("formats dates with date and time", () => {
      const formatted = formatActivityDateTime("2026-05-24T08:30:00.000Z");

      expect(formatted).toContain("2026");
      expect(formatted.length).toBeGreaterThan(8);
    });
  });

  describe("formatBpm", () => {
    it("formats heart rate values as rounded bpm", () => {
      expect(formatBpm(142.6)).toBe("143 bpm");
    });

    it("formats missing heart rate with an empty value", () => {
      expect(formatBpm(null)).toBe("--");
    });
  });

  describe("formatMeters", () => {
    it("formats meter values as rounded meters", () => {
      expect(formatMeters(123.6)).toBe("124 m");
    });

    it("formats missing meters with an empty value", () => {
      expect(formatMeters(null)).toBe("--");
    });
  });

  describe("formatSignedNumber", () => {
    it("adds a plus sign for positive values and zero", () => {
      expect(formatSignedNumber(3)).toBe("+3");
      expect(formatSignedNumber(0)).toBe("+0");
    });

    it("keeps the minus sign for negative values", () => {
      expect(formatSignedNumber(-2)).toBe("-2");
    });
  });
});
