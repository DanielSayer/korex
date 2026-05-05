export type SportType = "run" | "treadmill" | "hike";

export type ActivityInput = {
  averageCadenceStepsPerMinute: number | null;
  averageHeartRateBeatsPerMinute: number | null;
  averageSpeedMetersPerSecond: number | null;
  deviceName: string | null;
  distanceMeters: number | null;
  elapsedTimeSeconds: number | null;
  energyKilocalories: number | null;
  maxHeartRateBeatsPerMinute: number | null;
  maxSpeedMetersPerSecond: number | null;
  movingTimeSeconds: number | null;
  name: string;
  sportType: SportType;
  startAt: Date;
  totalElevationGainMeters: number | null;
  totalElevationLossMeters: number | null;
  userId: string;
};
