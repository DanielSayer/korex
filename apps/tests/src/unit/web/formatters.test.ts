import { describe, expect, it } from "vitest";
import {
  formatDistance,
  formatDurationClock,
  formatDurationCompact,
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
