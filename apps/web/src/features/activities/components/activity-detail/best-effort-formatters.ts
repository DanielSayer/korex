import type { BestEffortStandardDistanceCode } from "@korex/api/modules/activities/activities.types";

const BEST_EFFORT_STANDARD_DISTANCE_CODES = [
  "400m",
  "800m",
  "1000m",
  "1mi",
  "3000m",
  "5k",
  "10k",
  "half_marathon",
  "marathon",
] as const satisfies readonly BestEffortStandardDistanceCode[];

const DISTANCE_CONFIG: Record<
  BestEffortStandardDistanceCode,
  {
    color: string;
    glow: string;
    long: string;
    ring: string;
    short: string;
  }
> = {
  "400m": {
    short: "400m",
    long: "400 Meters",
    color: "var(--chart-1)",
    ring: "var(--border)",
    glow: "var(--chart-1)",
  },
  "800m": {
    short: "800m",
    long: "800 Meters",
    color: "var(--chart-2)",
    ring: "var(--border)",
    glow: "var(--chart-2)",
  },
  "1000m": {
    short: "1K",
    long: "1 Kilometer",
    color: "var(--chart-3)",
    ring: "var(--border)",
    glow: "var(--chart-3)",
  },
  "1mi": {
    short: "1MI",
    long: "1 Mile",
    color: "var(--chart-4)",
    ring: "var(--border)",
    glow: "var(--chart-4)",
  },
  "3000m": {
    short: "3K",
    long: "3 Kilometers",
    color: "var(--chart-5)",
    ring: "var(--border)",
    glow: "var(--chart-5)",
  },
  "5k": {
    short: "5K",
    long: "5 Kilometers",
    color: "var(--chart-1)",
    ring: "var(--border)",
    glow: "var(--chart-1)",
  },
  "10k": {
    short: "10K",
    long: "10 Kilometers",
    color: "var(--chart-2)",
    ring: "var(--border)",
    glow: "var(--chart-2)",
  },
  half_marathon: {
    short: "HM",
    long: "Half Marathon",
    color: "var(--chart-3)",
    ring: "var(--border)",
    glow: "var(--chart-3)",
  },
  marathon: {
    short: "FM",
    long: "Marathon",
    color: "var(--chart-4)",
    ring: "var(--border)",
    glow: "var(--chart-4)",
  },
};

function formatPace(distanceMeters: number, durationSeconds: number) {
  if (distanceMeters <= 0 || durationSeconds <= 0) {
    return "--";
  }

  const paceSecondsPerKm = durationSeconds / (distanceMeters / 1000);
  const roundedSeconds = Math.round(paceSecondsPerKm);
  const minutes = Math.floor(roundedSeconds / 60);
  const seconds = roundedSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
}

export { BEST_EFFORT_STANDARD_DISTANCE_CODES, DISTANCE_CONFIG, formatPace };
