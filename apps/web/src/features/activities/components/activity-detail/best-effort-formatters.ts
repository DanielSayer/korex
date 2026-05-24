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
    color: "#6b7280",
    ring: "#9ca3af",
    glow: "rgba(156,163,175,0.3)",
  },
  "800m": {
    short: "800m",
    long: "800 Meters",
    color: "#334155",
    ring: "#94a3b8",
    glow: "rgba(148,163,184,0.3)",
  },
  "1000m": {
    short: "1K",
    long: "1 Kilometer",
    color: "#475569",
    ring: "#94a3b8",
    glow: "rgba(148,163,184,0.3)",
  },
  "1mi": {
    short: "1MI",
    long: "1 Mile",
    color: "#92400e",
    ring: "#f59e0b",
    glow: "rgba(245,158,11,0.3)",
  },
  "3000m": {
    short: "3K",
    long: "3 Kilometers",
    color: "#115e59",
    ring: "#2dd4bf",
    glow: "rgba(45,212,191,0.3)",
  },
  "5k": {
    short: "5K",
    long: "5 Kilometers",
    color: "#1e40af",
    ring: "#60a5fa",
    glow: "rgba(96,165,250,0.3)",
  },
  "10k": {
    short: "10K",
    long: "10 Kilometers",
    color: "#065f46",
    ring: "#34d399",
    glow: "rgba(52,211,153,0.3)",
  },
  half_marathon: {
    short: "HM",
    long: "Half Marathon",
    color: "#5b21b6",
    ring: "#a78bfa",
    glow: "rgba(167,139,250,0.3)",
  },
  marathon: {
    short: "FM",
    long: "Marathon",
    color: "#7f1d1d",
    ring: "#f87171",
    glow: "rgba(248,113,113,0.3)",
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
