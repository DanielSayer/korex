import type { BestEffortStandardDistanceCode } from "@korex/api/modules/activities/activities.types";

const bestEffortDistanceLabels: Record<BestEffortStandardDistanceCode, string> =
  {
    "1000m": "1K",
    "10k": "10K",
    "1mi": "1 mile",
    "3000m": "3K",
    "400m": "400m",
    "5k": "5K",
    "800m": "800m",
    half_marathon: "Half marathon",
    marathon: "Marathon",
  };

const bestEffortDistanceCodes: BestEffortStandardDistanceCode[] = [
  "400m",
  "800m",
  "1000m",
  "1mi",
  "3000m",
  "5k",
  "10k",
  "half_marathon",
  "marathon",
];

const bestEffortSkeletonKeys = bestEffortDistanceCodes.slice(0, 8);

export {
  bestEffortDistanceCodes,
  bestEffortDistanceLabels,
  bestEffortSkeletonKeys,
};
